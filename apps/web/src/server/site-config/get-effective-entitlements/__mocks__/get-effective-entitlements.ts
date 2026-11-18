import type * as TModule from '@web/server/site-config/get-effective-entitlements/get-effective-entitlements';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';

export const getEffectiveEntitlements = vi.fn<
  typeof TModule.getEffectiveEntitlements
>(async () => mockTenantEntitlements());
