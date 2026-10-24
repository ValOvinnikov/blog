import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { resolveTenantPageAccess } from './resolve-tenant-page-access';

const { countLeadsForTenantMock } = vi.hoisted(() => ({
  countLeadsForTenantMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { leads: { countLeadsForTenant: countLeadsForTenantMock } },
}));

const membershipOf = (role: string) =>
  ({
    id: 'm-1',
    userId: 'user-1',
    tenantId: MOCK_TENANT_ID,
    role,
    createdAt: new Date(0),
  }) as Parameters<typeof resolveTenantPageAccess>[1];

describe(resolveTenantPageAccess, () => {
  beforeEach(() => {
    countLeadsForTenantMock.mockReset();
    countLeadsForTenantMock.mockResolvedValue(0);
  });

  it('opens Leads for an owner on a plan with the contact form, without reading leads', async () => {
    const access = await resolveTenantPageAccess(
      mockReadyTenant({ plan: TENANT_PLAN.GROWTH }),
      membershipOf(MEMBERSHIP_ROLE.OWNER),
    );

    expect(access.leads).toBe(true);
    expect(countLeadsForTenantMock).not.toHaveBeenCalled();
  });

  it('keeps Leads closed for a downgraded owner with no stored leads', async () => {
    const access = await resolveTenantPageAccess(
      mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.FREE }),
      membershipOf(MEMBERSHIP_ROLE.OWNER),
    );

    expect(access.leads).toBe(false);
    expect(countLeadsForTenantMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('keeps Leads open for a downgraded owner with stored leads', async () => {
    countLeadsForTenantMock.mockResolvedValue(2);

    const access = await resolveTenantPageAccess(
      mockReadyTenant({ plan: TENANT_PLAN.FREE }),
      membershipOf(MEMBERSHIP_ROLE.OWNER),
    );

    expect(access.leads).toBe(true);
  });

  it('closes Leads for an editor whatever the plan', async () => {
    const access = await resolveTenantPageAccess(
      mockReadyTenant({ plan: TENANT_PLAN.GROWTH }),
      membershipOf(MEMBERSHIP_ROLE.EDITOR),
    );

    expect(access.leads).toBe(false);
  });
});
