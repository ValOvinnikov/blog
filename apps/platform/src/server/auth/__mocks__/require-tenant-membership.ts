import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import {
  mockMembership,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';

export const requireTenantMembership = vi.fn(
  async (tenantId: string): Promise<TTenantMembershipContext> => {
    const membership = mockMembership({ tenantId });

    return {
      tenant: mockReadyTenant({ id: tenantId }),
      membership,
      viewer: mockViewer({ membership }),
    };
  },
);
