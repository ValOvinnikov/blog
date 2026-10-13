import type { TMaybeUndefined } from '@blog/config';
import { getTenantOwnerMembership } from '@blog/db/queries/memberships/get-tenant-owner-membership';

export async function getTenantOwnerEmail(
  tenantId: string,
): Promise<TMaybeUndefined<string>> {
  return (await getTenantOwnerMembership(tenantId))?.email;
}
