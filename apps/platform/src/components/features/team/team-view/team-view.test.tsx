import {
  TEAM_ROW_ACCESS,
  TEAM_SEAT_NOTICE_ID,
} from '@platform/constants/team-access';
import { ARIA_DESCRIBEDBY, ARIA_DISABLED } from '@platform/testing/aria';
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

  it("marks your own row, offers Remove where allowed and explains each row's access", () => {
    setup({
      team: mockTeamViewModel({
        hasEditor: true,
        members: [
          mockTeamOwnerRow(),
          mockTeamMemberRow({ access: TEAM_ROW_ACCESS.LOCKED }),
        ],
      }),
    });

    const you = screen.getByText('(you)');
    const removeButtons = screen.getAllByRole('button', { name: /^Remove/ });
    const removeMember = screen.getByRole('button', {
      name: `Remove ${MOCK_MEMBER_EMAIL}`,
    });
    const lockedHint = screen.getByText("Over your plan's seats");

    expect(you).toBeVisible();
    expect(removeButtons).toEqual([removeMember]);
    expect(lockedHint).toBeVisible();
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
