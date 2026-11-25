import {
  TEAM_ROW_ACCESS,
  TEAM_SEAT_NOTICE_ID,
} from '@platform/constants/team-access';
import { ARIA_DESCRIBEDBY, ARIA_DISABLED } from '@platform/testing/aria';
import { MOCK_GRACE_ENDS_AT } from '@platform/testing/billing/grace';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_ID,
} from '@platform/testing/team/fixtures';
import {
  MOCK_INVITEE_EMAIL,
  mockTeamInviteRow,
  mockTeamMemberRow,
  mockTeamOwnerRow,
  mockTeamViewModel,
} from '@platform/testing/team/team-view';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import { STUDIO_ACCESS, TENANT_PLAN } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
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

const INVITE_EDITOR = 'Invite editor';
const PENDING_INVITES = 'Pending invites';
const SEAT_LIMIT_TITLE = 'Every seat is in use';
const MOCK_READER_EMAIL = 'reader@example.com';
const MOCK_PENDING_EMAIL = 'pending@example.com';

const setup = customRender(TeamView, {
  tenantId: MOCK_TENANT_ID,
  plan: TENANT_PLAN.GROWTH,
  team: mockTeamViewModel(),
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

    it('shows the seats used and an enabled Invite editor', () => {
      const seats = screen.getByText('1 of 3 seats used');
      const invite = screen.getByRole('button', { name: INVITE_EDITOR });
      const notice = screen.queryByText(SEAT_LIMIT_TITLE);

      expect(seats).toBeVisible();
      expect(invite).not.toHaveAttribute(ARIA_DISABLED);
      expect(notice).not.toBeInTheDocument();
    });

    it('shows no Pending invites card', () => {
      const heading = screen.queryByRole('heading', { name: PENDING_INVITES });

      expect(heading).not.toBeInTheDocument();
    });
  });

  it('warns and holds Invite editor once every seat is used', () => {
    setup({
      team: mockTeamViewModel({ shownUsed: 3, isFull: true, freeSeats: 0 }),
    });

    const notice = screen.getByText(SEAT_LIMIT_TITLE);
    const invite = screen.getByRole('button', { name: INVITE_EDITOR });

    expect(notice).toBeVisible();
    expect(invite).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(invite).toHaveAttribute(ARIA_DESCRIBEDBY, TEAM_SEAT_NOTICE_ID);
  });

  describe('over the seats on Starter', () => {
    const overSeats = (graceEndsAt?: Date) =>
      setup({
        plan: TENANT_PLAN.STARTER,
        team: mockTeamViewModel({
          seats: 1,
          shownUsed: 3,
          isFull: true,
          freeSeats: 0,
          seatsOver: 2,
          graceEndsAt,
          members: [mockTeamOwnerRow(), mockTeamMemberRow()],
          invites: [mockTeamInviteRow()],
        }),
      });

    describe('with no grace running', () => {
      beforeEach(() => {
        overSeats();
      });

      it('offers Remove and Cancel invite but no Invite editor', () => {
        const invite = screen.queryByRole('button', { name: INVITE_EDITOR });
        const remove = screen.getByRole('button', {
          name: `Remove ${MOCK_MEMBER_EMAIL}`,
        });
        const cancel = screen.getByRole('button', {
          name: `Cancel invite to ${MOCK_INVITEE_EMAIL}`,
        });

        expect(invite).not.toBeInTheDocument();
        expect(remove).toBeVisible();
        expect(cancel).toBeVisible();
      });

      it('says how many must go, with no full notice and no deadline', () => {
        const seatsUsed = screen.getByText('3 of 1 seat used');
        const title = screen.getByText('Remove 2 people to fit Starter');
        const full = screen.queryByText(SEAT_LIMIT_TITLE);
        const deadline = screen.queryByText(/loses Studio access/);

        expect(seatsUsed).toBeVisible();
        expect(title).toBeVisible();
        expect(full).not.toBeInTheDocument();
        expect(deadline).not.toBeInTheDocument();
      });
    });

    it('names the grace deadline while a grace runs', () => {
      overSeats(MOCK_GRACE_ENDS_AT);

      const deadline = screen.getByText(/loses Studio access/);
      const date = within(deadline).getByText(/2026/);

      expect(deadline).toBeVisible();
      expect(date.tagName).toBe('TIME');
    });
  });

  it.each([
    [
      2,
      'No editors yet. Invite up to 2 people to write and publish in Studio with you.',
    ],
    [
      1,
      'No editors yet. Invite up to 1 person to write and publish in Studio with you.',
    ],
    [0, 'No editors yet. Every free seat is held by a pending invite.'],
  ])('notes the empty team with %s free seats', (freeSeats, note) => {
    setup({ team: mockTeamViewModel({ freeSeats }) });

    const noteText = screen.getByText(note);

    expect(noteText).toBeVisible();
  });

  it('tells an operator that no one has joined, with no editors note', () => {
    setup({ team: mockTeamViewModel({ members: [] }) });

    const empty = screen.getByText('No one has joined this site yet.');
    const note = screen.queryByText(/No editors yet/);

    expect(empty).toBeVisible();
    expect(note).not.toBeInTheDocument();
  });

  describe('with a locked, a reader and a pending member', () => {
    beforeEach(() => {
      setup({
        team: mockTeamViewModel({
          hasEditor: true,
          members: [
            mockTeamOwnerRow(),
            mockTeamMemberRow({ access: TEAM_ROW_ACCESS.LOCKED }),
            mockTeamMemberRow({
              membershipId: 'reader',
              email: MOCK_READER_EMAIL,
              role: MEMBERSHIP_ROLE.READER,
              access: TEAM_ROW_ACCESS.NO_ACCESS,
              canRemove: false,
            }),
            mockTeamMemberRow({
              membershipId: 'pending',
              email: MOCK_PENDING_EMAIL,
              access: STUDIO_ACCESS.INVITE_SENT,
              canRemove: false,
            }),
          ],
        }),
      });
    });

    it('marks your own row and offers Remove only where allowed', () => {
      const you = screen.getByText('(you)');
      const removeButtons = screen.getAllByRole('button', { name: /^Remove/ });
      const removeMember = screen.getByRole('button', {
        name: `Remove ${MOCK_MEMBER_EMAIL}`,
      });

      expect(you).toBeVisible();
      expect(removeButtons).toEqual([removeMember]);
    });

    it('shows a locked row as Locked over the seats', () => {
      const lockedBadge = screen.getByText('Locked');
      const lockedHint = screen.getByText("Over your plan's seats");

      expect(lockedBadge).toBeVisible();
      expect(lockedHint).toBeVisible();
    });

    it('shows a reader no badge, only "No Studio access"', () => {
      const readerRow = screen
        .getAllByRole('row')
        .find((row) => within(row).queryByText(MOCK_READER_EMAIL));
      const hint = within(readerRow!).getByText('No Studio access');
      const badges = within(readerRow!).queryAllByText(
        /Ready|Invite sent|Locked/,
      );

      expect(hint).toBeVisible();
      expect(badges).toEqual([]);
    });

    it('shows a pending row its badge but no Check now or Resend when not allowed', () => {
      const badge = screen.getByText('Invite sent');
      const checkNow = screen.queryByRole('button', { name: /^Check now/ });
      const resend = screen.queryByRole('button', { name: /^Resend invite/ });

      expect(badge).toBeVisible();
      expect(checkNow).not.toBeInTheDocument();
      expect(resend).not.toBeInTheDocument();
    });
  });

  it("checks a member's Studio access and names them in the toast", async () => {
    setup({
      team: mockTeamViewModel({
        members: [
          mockTeamOwnerRow(),
          mockTeamMemberRow({
            access: STUDIO_ACCESS.INVITE_SENT,
            canRequestAccess: true,
          }),
        ],
      }),
    });

    const checkNow = screen.getByRole('button', {
      name: `Check now for ${MOCK_MEMBER_EMAIL}`,
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

  it('lists a pending invite with its Cancel invite', () => {
    setup({ team: mockTeamViewModel({ invites: [mockTeamInviteRow()] }) });

    const [invites] = screen.getAllByRole('region', { name: PENDING_INVITES });
    const invitee = within(invites!).getByText(MOCK_INVITEE_EMAIL);
    const cancel = within(invites!).getByRole('button', {
      name: `Cancel invite to ${MOCK_INVITEE_EMAIL}`,
    });

    expect(invitee).toBeVisible();
    expect(cancel).toBeVisible();
  });
});
