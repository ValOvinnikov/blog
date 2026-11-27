import type { TTenantByIdContext } from '@platform/server/auth/require-tenant-by-id';
import { mockTenantByIdContext } from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';

export const requireTenantById = vi.fn(
  async (tenantId: string): Promise<TTenantByIdContext> =>
    mockTenantByIdContext(mockReadyTenant({ id: tenantId })),
);
