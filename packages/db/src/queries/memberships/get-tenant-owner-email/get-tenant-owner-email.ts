import type { TMaybeUndefined } from '@shinefold/config';
import { getTenantOwnerMembership } from '@shinefold/db/queries/memberships/get-tenant-owner-membership';

export async function getTenantOwnerEmail(
  tenantId: string,
): Promise<TMaybeUndefined<string>> {
  return (await getTenantOwnerMembership(tenantId))?.email;
}
