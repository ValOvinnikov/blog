import {
  mockMembership,
  mockOperatorViewer,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  type TMembershipRole,
} from '@shinefold/db/constants';

import { resolveTenantPageAccess } from './resolve-tenant-page-access';

vi.mock('@shinefold/db', () => ({
  queries: { leads: { countLeadsForTenant: vi.fn() } },
}));

const MOCK_STORED_LEAD_COUNT = 2;
const countLeadsForTenant = vi.mocked(queries.leads.countLeadsForTenant);

const resolveFor = (plan: TTenantPlan, role: TMembershipRole) =>
  resolveTenantPageAccess(
    mockReadyTenant({ id: MOCK_TENANT_ID, plan }),
    mockViewer({ membership: mockMembership({ role }) }),
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

  it('opens Leads to an operator on a plan with the contact form', async () => {
    const { leads } = await resolveTenantPageAccess(
      mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
      mockOperatorViewer(ADMIN_ROLE.MODERATOR),
    );

    expect(leads).toBe(true);
  });

  it.each([
    ['the real owner', mockViewer(), true],
    [
      'an editor',
      mockViewer({
        membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      }),
      false,
    ],
    ['a super admin', mockOperatorViewer(ADMIN_ROLE.SUPERADMIN), true],
    ['a moderator', mockOperatorViewer(ADMIN_ROLE.MODERATOR), false],
  ])('opens Billing to %s: %s', async (_label, viewer, isOpen) => {
    const { billing } = await resolveTenantPageAccess(
      mockReadyTenant({ id: MOCK_TENANT_ID }),
      viewer,
    );

    expect(billing).toBe(isOpen);
  });

  it.each([
    ['an owner on Growth', TENANT_PLAN.GROWTH, MEMBERSHIP_ROLE.OWNER, true],
    ['an editor on Growth', TENANT_PLAN.GROWTH, MEMBERSHIP_ROLE.EDITOR, false],
    ['a reader on Growth', TENANT_PLAN.GROWTH, MEMBERSHIP_ROLE.READER, false],
    ['an owner on Starter', TENANT_PLAN.STARTER, MEMBERSHIP_ROLE.OWNER, false],
    ['an owner on Free', TENANT_PLAN.FREE, MEMBERSHIP_ROLE.OWNER, false],
  ])('opens Team to %s: %s', async (_label, plan, role, isOpen) => {
    const { team } = await resolveFor(plan, role);

    expect(team).toBe(isOpen);
  });
});
