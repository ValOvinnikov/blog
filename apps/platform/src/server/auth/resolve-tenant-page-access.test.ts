import { queries } from '@blog/db';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  type TMembershipRole,
  type TTenantPlan,
} from '@blog/db/constants';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { resolveTenantPageAccess } from './resolve-tenant-page-access';

vi.mock('@blog/db', () => ({
  queries: { leads: { countLeadsForTenant: vi.fn() } },
}));

const MOCK_STORED_LEAD_COUNT = 2;

const countLeadsForTenant = vi.mocked(queries.leads.countLeadsForTenant);

const resolveFor = (plan: TTenantPlan, role: TMembershipRole) =>
  resolveTenantPageAccess(
    mockReadyTenant({ id: MOCK_TENANT_ID, plan }),
    mockMembership({ role }),
  );

describe(resolveTenantPageAccess, () => {
  beforeEach(() => {
    countLeadsForTenant.mockReset();
    countLeadsForTenant.mockResolvedValue(0);
  });

  it('opens Leads to an owner on a plan with the contact form', async () => {
    const { leads } = await resolveFor(
      TENANT_PLAN.GROWTH,
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(leads).toBe(true);
    expect(countLeadsForTenant).not.toHaveBeenCalled();
  });

  it('keeps Leads closed for a downgraded owner with no stored leads', async () => {
    const { leads } = await resolveFor(TENANT_PLAN.FREE, MEMBERSHIP_ROLE.OWNER);

    expect(leads).toBe(false);
    expect(countLeadsForTenant).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('keeps Leads open for a downgraded owner with stored leads', async () => {
    countLeadsForTenant.mockResolvedValue(MOCK_STORED_LEAD_COUNT);

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
