import {
  TEAM_MEMBERS_HEADING_ID,
  TEAM_REFUSAL,
  type TTeamRefusal,
} from '@platform/constants/team-access';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_ID,
} from '@platform/testing/team/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RemoveMemberControl } from './remove-member-control';

const { removeTeamMemberActionMock } = vi.hoisted(() => ({
  removeTeamMemberActionMock: vi.fn(),
}));

vi.mock('@platform/server/team/remove-team-member-action', () => ({
  removeTeamMemberAction: removeTeamMemberActionMock,
}));

const REMOVE_MEMBER = 'Remove member';
const REMOVE_TRIGGER = `Remove ${MOCK_MEMBER_EMAIL}`;
const MOCK_HEADING_LABEL = 'Members';

const refused = (reason: TTeamRefusal) => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

const RemoveMemberHarness = (
  props: Partial<Parameters<typeof RemoveMemberControl>[0]>,
) => (
  <>
    <h2 id={TEAM_MEMBERS_HEADING_ID} tabIndex={-1}>
      {MOCK_HEADING_LABEL}
    </h2>
    <RemoveMemberControl
      tenantId={MOCK_TENANT_ID}
      membershipId={MOCK_MEMBER_ID}
      email={MOCK_MEMBER_EMAIL}
      {...props}
    />
  </>
);

const setup = customRender(RemoveMemberHarness, {});

describe(`<${RemoveMemberControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    removeTeamMemberActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('reads "this member" for a member with no address', () => {
    setup({ email: undefined });

    const trigger = screen.getByRole('button', { name: 'Remove this member' });

    expect(trigger).toBeVisible();
  });

  describe('with the confirmation open', () => {
    beforeEach(async () => {
      setup();
      const trigger = screen.getByRole('button', { name: REMOVE_TRIGGER });
      await user.click(trigger);
    });

    it('asks before removing, naming the address', async () => {
      const dialog = await screen.findByRole('alertdialog', {
        name: `Remove ${MOCK_MEMBER_EMAIL}?`,
      });

      expect(dialog).toBeVisible();
      expect(removeTeamMemberActionMock).not.toHaveBeenCalled();
    });

    it('changes nothing when the member is kept', async () => {
      const keep = await screen.findByRole('button', { name: 'Keep member' });
      await user.click(keep);
      const dialog = screen.queryByRole('alertdialog');

      expect(dialog).not.toBeInTheDocument();
      expect(removeTeamMemberActionMock).not.toHaveBeenCalled();
    });

    describe('once confirmed', () => {
      const confirm = async () => {
        const confirmButton = await screen.findByRole('button', {
          name: REMOVE_MEMBER,
        });
        await user.click(confirmButton);
      };

      it('removes the member, confirms it and focuses the table title', async () => {
        await confirm();
        const toast = await screen.findByText(
          `${MOCK_MEMBER_EMAIL} was removed. Their Studio access is being revoked.`,
        );
        const heading = screen.getByRole('heading', {
          name: MOCK_HEADING_LABEL,
        });

        expect(removeTeamMemberActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          MOCK_MEMBER_ID,
        );
        expect(toast).toBeVisible();
        expect(refresh).toHaveBeenCalledOnce();
        expect(heading).toHaveFocus();
      });

      it('closes and refreshes when the member is already gone', async () => {
        removeTeamMemberActionMock.mockResolvedValue(
          refused(TEAM_REFUSAL.NOT_FOUND),
        );

        await confirm();
        const toast = await screen.findByText(
          `${MOCK_MEMBER_EMAIL} is no longer on the team.`,
        );
        const dialog = screen.queryByRole('alertdialog');

        expect(toast).toBeVisible();
        expect(refresh).toHaveBeenCalledOnce();
        expect(dialog).not.toBeInTheDocument();
      });

      it.each([
        [TEAM_REFUSAL.SELF, "You can't remove yourself from the team."],
        [
          TEAM_REFUSAL.LAST_OWNER,
          `A site always keeps one owner, so ${MOCK_MEMBER_EMAIL} can't be removed.`,
        ],
      ] as const)(
        'shows the %s refusal in the dialog',
        async (reason, message) => {
          removeTeamMemberActionMock.mockResolvedValue(refused(reason));

          await confirm();
          const refusal = await screen.findByText(message);
          const dialog = screen.getByRole('alertdialog');

          expect(refusal).toBeVisible();
          expect(dialog).toBeVisible();
        },
      );

      it('shows a failure in the dialog, which stays open', async () => {
        removeTeamMemberActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });

        await confirm();
        const failure = await screen.findByText(
          `Couldn't remove ${MOCK_MEMBER_EMAIL} — try again.`,
        );

        expect(failure).toBeVisible();
        expect(refresh).not.toHaveBeenCalled();
      });
    });
  });
});
