import { canManageSubscribers } from '@platform/server/subscribers/can-manage-subscribers';
import {
  mockMembership,
  mockMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import { MOCK_SEATS_OVER_ONE_SEAT } from '@platform/testing/team/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  type TAdminRole,
  type TMembershipRole,
} from '@shinefold/db/constants';

import { resolveTenantPageAccess } from './resolve-tenant-page-access';

vi.mock('@platform/server/subscribers/can-manage-subscribers', () => ({
  canManageSubscribers: vi.fn(async () => true),
}));

vi.mock('@shinefold/db', () => ({
  queries: {
    leads: { countLeadsForTenant: vi.fn() },
    membershipInvites: {
      countSeatsInUse: vi.fn(),
      countUnlockedSeatsInUse: vi.fn(),
    },
  },
}));

const MOCK_STORED_LEAD_COUNT = 2;
const countLeadsForTenant = vi.mocked(queries.leads.countLeadsForTenant);
const countSeatsInUse = vi.mocked(queries.membershipInvites.countSeatsInUse);
const countUnlockedSeatsInUse = vi.mocked(
  queries.membershipInvites.countUnlockedSeatsInUse,
);

const resolveFor = (plan: TTenantPlan, role: TMembershipRole) =>
  resolveTenantPageAccess(
    mockMembershipContext(
      mockReadyTenant({ id: MOCK_TENANT_ID, plan }),
      mockMembership({ role }),
    ),
  );

const resolveAsOperator = (
  role: TAdminRole,
  plan: TTenantPlan = TENANT_PLAN.FREE,
) =>
  resolveTenantPageAccess(
    mockOperatorMembershipContext(
      mockReadyTenant({ id: MOCK_TENANT_ID, plan }),
      role,
    ),
  );

describe(resolveTenantPageAccess, () => {
  beforeEach(() => {
    countLeadsForTenant.mockReset();
    countLeadsForTenant.mockResolvedValue(0);
    countSeatsInUse.mockReset();
    countSeatsInUse.mockResolvedValue(1);
    countUnlockedSeatsInUse.mockReset();
    countUnlockedSeatsInUse.mockResolvedValue(1);
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

  it.each([true, false])(
    'takes Subscribers for a manager from the subscribers rule: %s',
    async (isOpen) => {
      vi.mocked(canManageSubscribers).mockResolvedValue(isOpen);

      const { subscribers } = await resolveFor(
        TENANT_PLAN.GROWTH,
        MEMBERSHIP_ROLE.OWNER,
      );

      expect(subscribers).toBe(isOpen);
    },
  );

  it('closes Subscribers to an editor', async () => {
    const { subscribers } = await resolveFor(
      TENANT_PLAN.GROWTH,
      MEMBERSHIP_ROLE.EDITOR,
    );

    expect(subscribers).toBe(false);
    expect(canManageSubscribers).not.toHaveBeenCalled();
  });

  it('opens Leads to an operator on a plan with the contact form', async () => {
    const { leads } = await resolveAsOperator(
      ADMIN_ROLE.MODERATOR,
      TENANT_PLAN.GROWTH,
    );

    expect(leads).toBe(true);
  });

  it.each([
    [
      'the real owner',
      () => resolveFor(TENANT_PLAN.FREE, MEMBERSHIP_ROLE.OWNER),
      true,
    ],
    [
      'an editor',
      () => resolveFor(TENANT_PLAN.FREE, MEMBERSHIP_ROLE.EDITOR),
      false,
    ],
    ['a super admin', () => resolveAsOperator(ADMIN_ROLE.SUPERADMIN), true],
    ['a moderator', () => resolveAsOperator(ADMIN_ROLE.MODERATOR), false],
  ])('opens Billing to %s: %s', async (_label, resolve, isOpen) => {
    const { billing } = await resolve();

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

  it.each([
    ['a Starter owner', TENANT_PLAN.STARTER, MEMBERSHIP_ROLE.OWNER, true],
    ['a Free owner', TENANT_PLAN.FREE, MEMBERSHIP_ROLE.OWNER, true],
    ['a Starter editor', TENANT_PLAN.STARTER, MEMBERSHIP_ROLE.EDITOR, false],
  ])(
    'opens Team to %s while the site is over its seats: %s',
    async (_label, plan, role, isOpen) => {
      countSeatsInUse.mockResolvedValue(MOCK_SEATS_OVER_ONE_SEAT);
      countUnlockedSeatsInUse.mockResolvedValue(MOCK_SEATS_OVER_ONE_SEAT);

      const { team } = await resolveFor(plan, role);

      expect(team).toBe(isOpen);
    },
  );

  it.each([
    ['an owner', MEMBERSHIP_ROLE.OWNER, true],
    ['an editor', MEMBERSHIP_ROLE.EDITOR, false],
  ])(
    'opens Team on Free to %s while a member is locked: %s',
    async (_label, role, isOpen) => {
      countSeatsInUse.mockResolvedValue(MOCK_SEATS_OVER_ONE_SEAT);

      const { team } = await resolveFor(TENANT_PLAN.FREE, role);

      expect(team).toBe(isOpen);
    },
  );

  it('counts no seats when the plan already opens Team', async () => {
    await resolveFor(TENANT_PLAN.GROWTH, MEMBERSHIP_ROLE.OWNER);

    expect(countSeatsInUse).not.toHaveBeenCalled();
    expect(countUnlockedSeatsInUse).not.toHaveBeenCalled();
  });
});
