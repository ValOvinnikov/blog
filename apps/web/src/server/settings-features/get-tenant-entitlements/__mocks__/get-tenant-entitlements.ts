import { okResult } from '@shinefold/utils';
import type * as TModule from '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';

export const getTenantEntitlements = vi.fn<
  typeof TModule.getTenantEntitlements
>(async () => okResult(mockTenantEntitlements()));
