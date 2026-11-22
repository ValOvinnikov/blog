import type { TMaybeUndefined } from '@shinefold/config/types';
import { getTenantOwnerEmail } from '@shinefold/db/queries/memberships';
import type { TTenant } from '@shinefold/db/schema/tenants';
import type { TSanityUser } from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { loadTenant } from '@worker/units/run-reported-step';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { findStudioUser } from '@worker/utils/studio-access/find-studio-user';
import {
  isSameEmail,
  type TStudioProject,
} from '@worker/utils/studio-access/studio-project';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';
import { FatalError } from 'workflow';

export type TOwnerAccessTarget = TStudioProject & {
  tenant: TTenant;
  ownerEmail: string;
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
  const token = await requireTenantManagementToken(tenantId);
  return { tenant, projectId: sanityProjectId, ownerEmail, token, env };
}

export function hasOwnerEmail(
  target: TOwnerAccessTarget,
  email: TMaybeUndefined<string>,
): boolean {
  return isSameEmail(target.ownerEmail, email);
}

export function findOwner(
  target: TOwnerAccessTarget,
): Promise<TMaybeUndefined<TSanityUser>> {
  return findStudioUser(target, target.ownerEmail);
}
