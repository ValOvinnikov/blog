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
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import type { TSanityUser } from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { OWNER_ACCESS_ACTIVITY_TOUCH_FAILED_EVENT } from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';

import type { TOwnerAccessTarget } from './owner-access-target';

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
    logger.error(OWNER_ACCESS_ACTIVITY_TOUCH_FAILED_EVENT, {
      tenantId,
      error: touched.error,
    });
  }
}

export async function grantOwnerAdministrator(
  target: TOwnerAccessTarget,
  owner: TSanityUser,
): Promise<TElevateTenantOwnerOutcome> {
  const { tenant, projectId, env } = target;
  const token = env.sanityManagementToken;

  const acl = await listSanityProjectAcl({ token, projectId });
  const entry = acl.find(
    ({ projectUserId }) => projectUserId === owner.profile.id,
  );
  if (!entry) {
    throw new Error(
      `Tenant "${tenant.id}"'s owner is a project member with no ACL entry yet.`,
    );
  }

  const isAdministrator = entry.roles.some(
    ({ name }) => name === SANITY_PROJECT_ROLE.ADMINISTRATOR,
  );
  if (!isAdministrator) {
    await grantSanityProjectRole({
      token,
      projectId,
      projectUserId: entry.projectUserId,
      role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
    });
  }

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

  return isAdministrator
    ? ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR
    : ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED;
}
