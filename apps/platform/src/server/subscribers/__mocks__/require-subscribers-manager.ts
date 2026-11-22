import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { mockMembershipContext } from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN } from '@shinefold/config/constants';

export const requireSubscribersManager = vi.fn(
  async (tenantId: string): Promise<TTenantMembershipContext> =>
    mockMembershipContext(
      mockReadyTenant({ id: tenantId, plan: TENANT_PLAN.GROWTH }),
    ),
);
