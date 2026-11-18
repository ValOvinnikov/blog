import type { TListedEntitlementGrant } from '@shinefold/db/queries/tenant-entitlement-grants/list-entitlement-grants/list-entitlement-grants';

export const tenantEntitlementGrants = {
  listEntitlementGrants: vi.fn(
    async (): Promise<TListedEntitlementGrant[]> => [],
  ),
};
