import type * as TModule from '@web/server/tenant/tenant-entitlements/tenant-entitlements';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';

export const getCachedTenantEntitlements = vi.fn<
  typeof TModule.getCachedTenantEntitlements
>(async () => mockTenantEntitlements());

export const resolveTenantPlanEntitlements = vi.fn<
  typeof TModule.resolveTenantPlanEntitlements
>(async (_tenantId, plan) => mockTenantEntitlements(plan));

export const resolveProxyTenantPlanEntitlements = vi.fn<
  typeof TModule.resolveProxyTenantPlanEntitlements
>(async (_tenantId, plan) => mockTenantEntitlements(plan));
