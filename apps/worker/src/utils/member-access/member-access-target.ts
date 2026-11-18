import type { TMaybeUndefined } from '@shinefold/config/types';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import {
  getMemberStudioAccess,
  getTenantOwnerEmail,
} from '@shinefold/db/queries/memberships';
import type { TMemberStudioAccess } from '@shinefold/db/queries/memberships/member-studio-access';
import { loadTenant } from '@worker/units/run-reported-step';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';
import {
  isSameEmail,
  type TStudioProject,
} from '@worker/utils/studio-access/studio-project';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';
import { FatalError } from 'workflow';

export type TMemberAccessTarget = TStudioProject & {
  tenantId: string;
  membershipId: string;
  email: string;
  access: TMemberStudioAccess;
};

export async function isTenantOwnerEmail(
  tenantId: string,
  email: string,
): Promise<boolean> {
  const ownerEmail = await getTenantOwnerEmail(tenantId);
  return !!ownerEmail && isSameEmail(ownerEmail, email);
}

// Resolves undefined for a membership the member flow does not serve: removed, locked, not an EDITOR, or the owner's own address.
export async function loadMemberAccessTarget(
  tenantId: string,
  membershipId: string,
): Promise<TMaybeUndefined<TMemberAccessTarget>> {
  const tenant = await loadTenant(tenantId);
  const { sanityProjectId } = tenant;
  if (!sanityProjectId) {
    throw new FatalError(`Tenant "${tenantId}" has no Sanity project yet.`);
  }

  const member = await getMemberStudioAccess(tenantId, membershipId);
  if (!member?.email || member.role !== MEMBERSHIP_ROLE.EDITOR) {
    return undefined;
  }
  const { email, access } = member;
  if (await isTenantOwnerEmail(tenantId, email)) return undefined;

  return {
    tenantId,
    membershipId,
    email,
    access,
    projectId: sanityProjectId,
    token: await requireTenantManagementToken(tenantId),
    env: getProvisionEnv(),
  };
}
