import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { mockMembershipContext } from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';

export const requireTenantMembership = vi.fn(
  async (tenantId: string): Promise<TTenantMembershipContext> =>
    mockMembershipContext(mockReadyTenant({ id: tenantId })),
);
