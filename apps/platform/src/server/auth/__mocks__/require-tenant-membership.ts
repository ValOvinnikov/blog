import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';

export const requireTenantMembership = vi.fn(
  async (tenantId: string): Promise<TTenantMembershipContext> => ({
    tenant: makeReadyTenant({ id: tenantId }),
    membership: {
      id: 'membership-1',
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
      createdAt: new Date('2026-04-02T00:00:00.000Z'),
    },
  }),
);
