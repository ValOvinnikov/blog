import { TEAM_SEAT_NOTICE_ID } from '@platform/constants/team-access';
import { ARIA_DESCRIBEDBY, ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  mockMembership,
  mockOperatorViewer,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_JOINED_AT,
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_ID,
  mockPendingInvite,
  mockTenantMember,
} from '@platform/testing/team/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { mockTenant } from '@platform/testing/tenants/mock-tenant';
import {
  teamViewModel,
  type TTeamViewModel,
} from '@platform/utils/team-view-model/team-view-model';
import { ACTION_OUTCOME } from '@shinefold/config';
import { STUDIO_ACCESS, TENANT_PLAN } from '@shinefold/config/constants';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TeamView } from './team-view';

const { checkMemberAccessActionMock } = vi.hoisted(() => ({
  checkMemberAccessActionMock: vi.fn(),
}));

vi.mock('@platform/server/team/check-member-access-action', () => ({
  checkMemberAccessAction: checkMemberAccessActionMock,
}));
vi.mock('@platform/server/team/resend-member-invite-action');
vi.mock('@platform/server/team/invite-team-member-action');
vi.mock('@platform/server/team/remove-team-member-action');
vi.mock('@platform/server/team/cancel-team-invite-action');
vi.mock('@platform/server/owner-access/check-owner-access-action');
vi.mock('@platform/server/owner-access/resend-owner-invite-action');

const MOCK_OWNER_USER_ID = 'owner-user';
const MOCK_OWNER_EMAIL = 'owner@example.com';
const MOCK_INVITE_EMAIL = 'invitee@example.com';
const MOCK_OWNER = mockTenantMember({
  membershipId: 'owner-membership',
  userId: MOCK_OWNER_USER_ID,
  email: MOCK_OWNER_EMAIL,
  role: MEMBERSHIP_ROLE.OWNER,
});
const OWNER_VIEWER = mockViewer({
  membership: mockMembership({ userId: MOCK_OWNER_USER_ID }),
});
const INVITE_EDITOR = 'Invite editor';
const PENDING_INVITES = 'Pending invites';
const SEAT_LIMIT_TITLE = 'Every seat is in use';
const INVITE_SENT_MEMBER = mockTenantMember({
  studioAccess: STUDIO_ACCESS.INVITE_SENT,
});

const teamOf = (
  overrides: Partial<Parameters<typeof teamViewModel>[0]> = {},
): TTeamViewModel =>
  teamViewModel(
    {
      tenant: mockTenant({ plan: TENANT_PLAN.GROWTH }),
      viewer: OWNER_VIEWER,
      currentUserId: MOCK_OWNER_USER_ID,
      members: [MOCK_OWNER],
      invites: [],
      ...overrides,
    },
    MOCK_JOINED_AT,
  );

const setup = customRender(TeamView, {
  tenantId: MOCK_TENANT_ID,
  plan: TENANT_PLAN.GROWTH,
  team: teamOf(),
});

describe(`<${TeamView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    checkMemberAccessActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  describe('with the owner alone', () => {
    beforeEach(() => {
      setup();
    });

    it('shows the seats used and an enabled Invite editor with seats free', () => {
      const seats = screen.getByText('1 of 3 seats used');
      const invite = screen.getByRole('button', { name: INVITE_EDITOR });
      const notice = screen.queryByText(SEAT_LIMIT_TITLE);

      expect(seats).toBeVisible();
      expect(invite).not.toHaveAttribute(ARIA_DISABLED);
      expect(notice).not.toBeInTheDocument();
    });

    it('shows no Pending invites card with no invite listed', () => {
      const heading = screen.queryByRole('heading', { name: PENDING_INVITES });

      expect(heading).not.toBeInTheDocument();
    });
  });

  it('warns and holds Invite editor once every seat is used', () => {
    setup({
      team: teamOf({
        invites: [mockPendingInvite(), mockPendingInvite({ inviteId: 'x' })],
      }),
    });

    const notice = screen.getByText(SEAT_LIMIT_TITLE);
    const seats = screen.getByText('3 of 3 seats used');
    const invite = screen.getByRole('button', { name: INVITE_EDITOR });

    expect(notice).toBeVisible();
    expect(seats).toBeVisible();
    expect(invite).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(invite).toHaveAttribute(ARIA_DESCRIBEDBY, TEAM_SEAT_NOTICE_ID);
  });

  it.each([
    [
      'two free seats',
      [],
      'No editors yet. Invite up to 2 people to write and publish in Studio with you.',
    ],
    [
      'one free seat',
      [mockPendingInvite()],
      'No editors yet. Invite up to 1 person to write and publish in Studio with you.',
    ],
    [
      'no free seat',
      [mockPendingInvite(), mockPendingInvite({ inviteId: 'x' })],
      'No editors yet. Every free seat is held by a pending invite.',
    ],
  ])('notes the empty team with %s', (_label, invites, note) => {
    setup({ team: teamOf({ invites }) });

    const noteText = screen.getByText(note);

    expect(noteText).toBeVisible();
  });

  it('tells an operator that no one has joined, with no editors note', () => {
    setup({
      team: teamOf({
        viewer: mockOperatorViewer(ADMIN_ROLE.MODERATOR),
        currentUserId: undefined,
        members: [],
      }),
    });

    const empty = screen.getByText('No one has joined this site yet.');
    const note = screen.queryByText(/No editors yet/);

    expect(empty).toBeVisible();
    expect(note).not.toBeInTheDocument();
  });

  it('marks your own row and offers Remove only on the others', () => {
    setup({ team: teamOf({ members: [MOCK_OWNER, mockTenantMember()] }) });

    const you = screen.getByText('(you)');
    const removeButtons = screen.getAllByRole('button', { name: /^Remove/ });
    const removeMember = screen.getByRole('button', {
      name: `Remove ${MOCK_MEMBER_EMAIL}`,
    });

    expect(you).toBeVisible();
    expect(removeButtons).toEqual([removeMember]);
  });

  it.each([
    ['a locked member', { lockedAt: MOCK_JOINED_AT }, "Over your plan's seats"],
    ['a reader', { role: MEMBERSHIP_ROLE.READER }, 'No Studio access'],
    [
      'a just-joined member',
      {},
      'Accepted — editing rights usually take a minute',
    ],
  ] as const)('explains the Studio access of %s', (_label, overrides, hint) => {
    setup({
      team: teamOf({ members: [MOCK_OWNER, mockTenantMember(overrides)] }),
    });

    const hintText = screen.getByText(hint);

    expect(hintText).toBeVisible();
  });

  it("checks a member's Studio access and names them in the toast", async () => {
    setup({ team: teamOf({ members: [MOCK_OWNER, INVITE_SENT_MEMBER] }) });

    const checkNow = screen.getByRole('button', {
      name: `Check ${MOCK_MEMBER_EMAIL}'s Studio access now`,
    });
    await user.click(checkNow);
    const toast = await screen.findByText(
      `Checking ${MOCK_MEMBER_EMAIL}'s Studio access now. Refresh in a minute to see the result.`,
    );

    expect(checkMemberAccessActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_MEMBER_ID,
    );
    expect(toast).toBeVisible();
  });

  it('hides Check now and Resend from an operator who is not a SUPERADMIN', () => {
    setup({
      team: teamOf({
        viewer: mockOperatorViewer(ADMIN_ROLE.MODERATOR),
        members: [MOCK_OWNER, INVITE_SENT_MEMBER],
      }),
    });

    const badge = screen.getByText('Invite sent');
    const checkNow = screen.queryByRole('button', { name: /Check/ });

    expect(badge).toBeVisible();
    expect(checkNow).not.toBeInTheDocument();
  });

  it('lists pending invites, an owner invite excepted, with a Cancel invite each', () => {
    setup({
      team: teamOf({
        invites: [
          mockPendingInvite({ email: MOCK_INVITE_EMAIL }),
          mockPendingInvite({ inviteId: 'owner', role: MEMBERSHIP_ROLE.OWNER }),
        ],
      }),
    });

    const [invites] = screen.getAllByRole('region', { name: PENDING_INVITES });
    const invitee = within(invites!).getByText(MOCK_INVITE_EMAIL);
    const cancelButtons = within(invites!).getAllByRole('button', {
      name: /^Cancel the invite/,
    });

    expect(invitee).toBeVisible();
    expect(cancelButtons).toHaveLength(1);
  });
});
