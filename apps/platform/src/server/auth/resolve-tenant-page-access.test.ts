import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  type TMembershipRole,
  type TTenantPlan,
} from '@blog/db/constants';
import { mockMembership } from '@platform/testing/memberships/fixtures';
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

const MOCK_STORED_LEAD_COUNT = 2;

const resolveFor = (plan: TTenantPlan, role: TMembershipRole) =>
  resolveTenantPageAccess(
    mockReadyTenant({ id: MOCK_TENANT_ID, plan }),
    mockMembership({ role }),
  );

describe(resolveTenantPageAccess, () => {
  beforeEach(() => {
    countLeadsForTenantMock.mockReset();
    countLeadsForTenantMock.mockResolvedValue(0);
  });

  it('opens Leads to an owner on a plan with the contact form', async () => {
    const { leads } = await resolveFor(
      TENANT_PLAN.GROWTH,
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(leads).toBe(true);
    expect(countLeadsForTenantMock).not.toHaveBeenCalled();
  });

  it('keeps Leads closed for a downgraded owner with no stored leads', async () => {
    const { leads } = await resolveFor(TENANT_PLAN.FREE, MEMBERSHIP_ROLE.OWNER);

    expect(leads).toBe(false);
    expect(countLeadsForTenantMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('keeps Leads open for a downgraded owner with stored leads', async () => {
    countLeadsForTenantMock.mockResolvedValue(MOCK_STORED_LEAD_COUNT);

    const { leads } = await resolveFor(TENANT_PLAN.FREE, MEMBERSHIP_ROLE.OWNER);

    expect(leads).toBe(true);
  });

  it('closes Leads to an editor whatever the plan', async () => {
    const { leads } = await resolveFor(
      TENANT_PLAN.GROWTH,
      MEMBERSHIP_ROLE.EDITOR,
    );

    expect(leads).toBe(false);
  });
});
