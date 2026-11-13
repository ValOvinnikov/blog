import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';

export const requireTenantMembership = vi.fn(
  async (tenantId: string): Promise<TTenantMembershipContext> => ({
    tenant: mockReadyTenant({ id: tenantId }),
    membership: mockMembership({ tenantId }),
  }),
);
