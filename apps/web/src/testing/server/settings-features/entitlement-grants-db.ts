import type { TResolvableGrant } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export const tenantEntitlementGrants = {
  listResolvableEntitlementGrants: vi.fn(
    async (): Promise<TResolvableGrant[]> => [],
  ),
};
