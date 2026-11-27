import messages from '@platform/i18n/messages/en.json';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_JOINED_AT,
  MOCK_SEATS_OVER_ONE_SEAT,
  mockTenantMember,
} from '@platform/testing/team/fixtures';
import { mockTeamOwner } from '@platform/testing/team/team-view';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { noEntitlementGrantQueries } from '@platform/testing/tenants/no-entitlement-grant-queries';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@shinefold/db/constants';

import DashboardTeamPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  listTenantMembersMock,
  listPendingMembershipInvitesMock,
  countSeatsInUseMock,
  countUnlockedSeatsInUseMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  listTenantMembersMock: vi.fn(),
  listPendingMembershipInvitesMock: vi.fn(),
  countSeatsInUseMock: vi.fn(),
  countUnlockedSeatsInUseMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');
vi.mock('@platform/server/team/invite-team-member-action');
vi.mock('@platform/server/team/remove-team-member-action');
vi.mock('@platform/server/team/cancel-team-invite-action');
vi.mock('@platform/server/team/check-member-access-action');
vi.mock('@platform/server/team/resend-member-invite-action');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    ...noEntitlementGrantQueries(),
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
      listTenantMembers: listTenantMembersMock,
    },
    membershipInvites: {
      listPendingMembershipInvites: listPendingMembershipInvitesMock,
      countSeatsInUse: countSeatsInUseMock,
      countUnlockedSeatsInUse: countUnlockedSeatsInUseMock,
    },
    admins: { getAdminByUserId: vi.fn(async () => undefined) },
    leads: { countLeadsForTenant: vi.fn(async () => 0) },
    tenants: { listTenants: vi.fn(async () => []) },
  },
}));

const signInAs = (role: TMembershipRole, plan: TTenantPlan) =>
  listMembershipsWithTenantsForUserMock.mockResolvedValue([
    {
      membership: mockMembership({ role }),
      tenant: mockReadyTenant({ plan }),
    },
  ]);

const setup = customRenderAsync(DashboardTeamPage, {});

describe(`<${DashboardTeamPage.name}/>`, () => {
  beforeEach(() => {
    listTenantMembersMock.mockResolvedValue([
      mockTenantMember({ role: MEMBERSHIP_ROLE.OWNER }),
    ]);
    listPendingMembershipInvitesMock.mockResolvedValue([]);
    countSeatsInUseMock.mockResolvedValue(1);
    countUnlockedSeatsInUseMock.mockResolvedValue(1);
  });

  it("shows the owner their site's team on Growth", async () => {
    signInAs(MEMBERSHIP_ROLE.OWNER, TENANT_PLAN.GROWTH);

    await setup();
    const heading = screen.getByRole('heading', {
      level: 1,
      name: messages.teamPage.title,
    });

    expect(heading).toBeVisible();
    expect(listTenantMembersMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it.each([
    ['an editor on Growth', MEMBERSHIP_ROLE.EDITOR, TENANT_PLAN.GROWTH],
    ['an owner on Starter', MEMBERSHIP_ROLE.OWNER, TENANT_PLAN.STARTER],
    ['an owner on Free', MEMBERSHIP_ROLE.OWNER, TENANT_PLAN.FREE],
  ])('is not found for %s, reading no members', async (_label, role, plan) => {
    signInAs(role, plan);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(listTenantMembersMock).not.toHaveBeenCalled();
  });

  it('shows the owner of a Starter site over its seats its team, with no Invite editor', async () => {
    signInAs(MEMBERSHIP_ROLE.OWNER, TENANT_PLAN.STARTER);
    countSeatsInUseMock.mockResolvedValue(MOCK_SEATS_OVER_ONE_SEAT);
    countUnlockedSeatsInUseMock.mockResolvedValue(MOCK_SEATS_OVER_ONE_SEAT);
    listTenantMembersMock.mockResolvedValue([
      mockTeamOwner(),
      mockTenantMember(),
    ]);

    await setup();
    const heading = screen.getByRole('heading', {
      level: 1,
      name: messages.teamPage.title,
    });
    const invite = screen.queryByRole('button', {
      name: messages.teamPage.inviteEditor,
    });

    expect(heading).toBeVisible();
    expect(invite).not.toBeInTheDocument();
  });

  it('shows a Free owner who is locked, with Upgrade', async () => {
    signInAs(MEMBERSHIP_ROLE.OWNER, TENANT_PLAN.FREE);
    countSeatsInUseMock.mockResolvedValue(MOCK_SEATS_OVER_ONE_SEAT);
    listTenantMembersMock.mockResolvedValue([
      mockTeamOwner(),
      mockTenantMember({ lockedAt: MOCK_JOINED_AT }),
    ]);

    await setup();
    const locked = screen.getByText('1 member is locked');
    const upgrade = screen.getByRole('link', {
      name: messages.teamPage.upgrade,
    });

    expect(locked).toBeVisible();
    expect(upgrade).toBeVisible();
  });
});
