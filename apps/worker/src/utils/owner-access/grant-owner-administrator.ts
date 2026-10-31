import {
  SANITY_LOGIN_PROVIDER,
  SANITY_PROJECT_ROLE,
  type TSanityLoginProvider,
} from '@blog/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  SANITY_PROJECT_ROLE as STORED_SANITY_PROJECT_ROLE,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import {
  setTenantOwnerAccess,
  touchTenantActivity,
} from '@blog/db/queries/tenants';
import {
  grantSanityProjectRole,
  listSanityProjectAcl,
  revokeSanityProjectRole,
  type TSanityAclEntry,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import type { TSanityUser } from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';

import { findProjectAclEntry } from './find-project-acl-entry';
import {
  type TOwnerAccessTarget,
  tokenForRoleChange,
} from './owner-access-target';

function toLoginProvider(
  provider: TMaybeUndefined<string>,
): TMaybeNull<TSanityLoginProvider> {
  const normalized = provider?.toUpperCase();
  return (
    Object.values(SANITY_LOGIN_PROVIDER).find(
      (value) => value === normalized,
    ) ?? null
  );
}

async function touchActivityOnInviteAcceptance(
  tenantId: string,
  acceptedAt: Date,
): Promise<void> {
  const touched = await touchTenantActivity(tenantId, acceptedAt);
  if (!touched.ok) {
    logger.error(OWNER_ACCESS_LOG.ACTIVITY_TOUCH_FAILED, {
      tenantId,
      error: touched.error,
    });
  }
}

function rolesBesideAdministrator(entry: TSanityAclEntry): string[] {
  return entry.roles
    .map(({ name }) => name)
    .filter((name) => name !== SANITY_PROJECT_ROLE.ADMINISTRATOR);
}

async function revokeRoles(
  target: TOwnerAccessTarget,
  entry: TSanityAclEntry,
  roleNames: string[],
): Promise<void> {
  const { projectId, token } = target;
  for (const name of roleNames) {
    await revokeSanityProjectRole({
      token,
      projectId,
      projectUserId: entry.projectUserId,
      roleName: name,
    });
  }
}

export async function grantOwnerAdministrator(
  target: TOwnerAccessTarget,
  owner: TSanityUser,
): Promise<TElevateTenantOwnerOutcome> {
  const { tenant, projectId, token } = target;

  const acl = await listSanityProjectAcl({ token, projectId });
  const entry = findProjectAclEntry(acl, owner, projectId);
  if (!entry) {
    throw new Error(
      `Tenant "${tenant.id}"'s owner is a project member with no ACL entry yet.`,
    );
  }

  const isAdministrator = entry.roles.some(
    ({ name }) => name === SANITY_PROJECT_ROLE.ADMINISTRATOR,
  );
  const otherRoles = rolesBesideAdministrator(entry);
  if (!isAdministrator) {
    await grantSanityProjectRole({
      token: tokenForRoleChange(target, SANITY_PROJECT_ROLE.ADMINISTRATOR),
      projectId,
      projectUserId: entry.projectUserId,
      role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
    });
  }
  await revokeRoles(target, entry, otherRoles);

  const inviteAcceptedAt = tenant.ownerInviteAcceptedAt ?? new Date();
  const recorded = await setTenantOwnerAccess(tenant.id, {
    inviteAcceptedAt,
    sanityUserId: owner.sanityUserId,
    loginProvider: toLoginProvider(owner.profile.provider),
    sanityRole: STORED_SANITY_PROJECT_ROLE.ADMINISTRATOR,
  });
  if (!recorded.ok) {
    throw new Error(
      `Tenant "${tenant.id}"'s owner access could not be recorded (${recorded.error}).`,
    );
  }

  if (!tenant.ownerInviteAcceptedAt) {
    await touchActivityOnInviteAcceptance(tenant.id, inviteAcceptedAt);
  }

  return isAdministrator && otherRoles.length === 0
    ? ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR
    : ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED;
}
