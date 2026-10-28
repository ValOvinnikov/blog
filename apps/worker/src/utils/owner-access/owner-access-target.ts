import { SANITY_PROJECT_ROLE } from '@blog/config';
import type { TMaybeUndefined } from '@blog/config/types';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  assignSanityProjectUserRole,
  listSanityOrganizationUsers,
  listSanityProjectUsers,
  type TSanityUser,
} from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { loadTenant } from '@worker/units/run-reported-step';
import {
  getProvisionEnv,
  type TProvisionEnv,
} from '@worker/utils/provision-env/provision-env';
import { FatalError } from 'workflow';

export type TOwnerAccessTarget = {
  tenant: TTenant;
  projectId: string;
  ownerEmail: string;
  env: TProvisionEnv;
};

export async function loadOwnerAccessTarget(
  tenantId: string,
): Promise<TOwnerAccessTarget> {
  const env = getProvisionEnv();
  const tenant = await loadTenant(tenantId);
  const { sanityProjectId } = tenant;
  if (!sanityProjectId) {
    throw new FatalError(`Tenant "${tenantId}" has no Sanity project yet.`);
  }
  const ownerEmail = await getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    throw new FatalError(`Tenant "${tenantId}" has no owner email.`);
  }
  return { tenant, projectId: sanityProjectId, ownerEmail, env };
}

export function hasOwnerEmail(
  target: TOwnerAccessTarget,
  email: TMaybeUndefined<string>,
): boolean {
  return !!email && normalizeEmail(email) === normalizeEmail(target.ownerEmail);
}

export async function findOwner(
  target: TOwnerAccessTarget,
): Promise<TMaybeUndefined<TSanityUser>> {
  const { env, projectId } = target;
  const token = env.sanityManagementToken;

  const projectUsers = await listSanityProjectUsers({ token, projectId });
  const member = projectUsers.find(({ profile }) =>
    hasOwnerEmail(target, profile.email),
  );
  if (member) return member;

  const organizationUsers = await listSanityOrganizationUsers({
    token,
    organizationId: env.sanityOrganizationId,
  });
  const organizationUser = organizationUsers.find(({ profile }) =>
    hasOwnerEmail(target, profile.email),
  );
  if (!organizationUser) return undefined;

  await assignSanityProjectUserRole({
    token,
    projectId,
    sanityUserId: organizationUser.sanityUserId,
    role: SANITY_PROJECT_ROLE.VIEWER,
  });
  return organizationUser;
}
