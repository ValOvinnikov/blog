import type { loadPlatformTenant as TLoadPlatformTenant } from '@platform/server/tenants/load-platform-tenant';
import { toPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const loadPlatformTenant = vi.fn<typeof TLoadPlatformTenant>(
  async (tenant) => toPlatformTenant(tenant, []),
);
