import {
  TEAM_INVITE_FIELD_ERROR,
  type TTeamInviteFieldError,
} from '@platform/constants/team-access';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_MEMBER_EMAIL } from '@platform/testing/team/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { InviteEditorControl } from './invite-editor-control';

const { inviteTeamMemberActionMock } = vi.hoisted(() => ({
  inviteTeamMemberActionMock: vi.fn(),
}));

vi.mock('@platform/server/team/invite-team-member-action', () => ({
  inviteTeamMemberAction: inviteTeamMemberActionMock,
}));

const INVITE_EDITOR = 'Invite editor';
const SEND_INVITE = 'Send invite';
const EMAIL_ADDRESS = 'Email address';
const CANCEL = 'Cancel';
const MOCK_TYPED_EMAIL = MOCK_MEMBER_EMAIL.toUpperCase();

const invalidEmail = (reason: TTeamInviteFieldError, email?: string) => ({
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: { email: { reason, values: email ? { email } : undefined } },
});

const setup = customRender(InviteEditorControl, {
  tenantId: MOCK_TENANT_ID,
  plan: TENANT_PLAN.GROWTH,
  isFull: false,
});

describe(`<${InviteEditorControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    inviteTeamMemberActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('opens nothing while every seat is used', async () => {
    setup({ isFull: true });

    const invite = screen.getByRole('button', { name: INVITE_EDITOR });
    await user.click(invite);
    const dialog = screen.queryByRole('dialog');

    expect(invite).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(dialog).not.toBeInTheDocument();
  });

  describe('with seats free', () => {
    beforeEach(async () => {
      setup();
      const invite = screen.getByRole('button', { name: INVITE_EDITOR });
      await user.click(invite);
    });

    it('opens the dialog with the address field empty and focused', async () => {
      const field = await screen.findByLabelText(EMAIL_ADDRESS);
      const dialog = screen.getByRole('dialog', { name: 'Invite an editor' });

      expect(dialog).toBeVisible();
      expect(field).toHaveValue('');
      expect(field).toHaveFocus();
    });

    it('clears the address when cancelled and reopened', async () => {
      const field = screen.getByLabelText(EMAIL_ADDRESS);
      await user.type(field, MOCK_TYPED_EMAIL);

      const cancel = screen.getByRole('button', { name: CANCEL });
      await user.click(cancel);
      const invite = screen.getByRole('button', { name: INVITE_EDITOR });
      await user.click(invite);
      const reopenedField = await screen.findByLabelText(EMAIL_ADDRESS);

      expect(reopenedField).toHaveValue('');
    });

    describe('with an address typed', () => {
      let send: HTMLElement;

      beforeEach(async () => {
        const field = screen.getByLabelText(EMAIL_ADDRESS);
        await user.type(field, MOCK_TYPED_EMAIL);
        send = screen.getByRole('button', { name: SEND_INVITE });
      });

      it('sends the invite, names the lower-cased address and refreshes', async () => {
        await user.click(send);
        const toast = await screen.findByText(
          `Invite sent to ${MOCK_MEMBER_EMAIL}.`,
        );
        const dialog = screen.queryByRole('dialog');

        expect(inviteTeamMemberActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          { email: MOCK_TYPED_EMAIL },
        );
        expect(toast).toBeVisible();
        expect(refresh).toHaveBeenCalledOnce();
        expect(dialog).not.toBeInTheDocument();
      });

      it.each([
        [
          TEAM_INVITE_FIELD_ERROR.EMAIL_INVALID,
          undefined,
          'Enter an email address, like name@example.com.',
        ],
        [
          TEAM_INVITE_FIELD_ERROR.ALREADY_MEMBER,
          MOCK_MEMBER_EMAIL,
          `${MOCK_MEMBER_EMAIL} is already on the team.`,
        ],
        [
          TEAM_INVITE_FIELD_ERROR.ALREADY_INVITED,
          MOCK_MEMBER_EMAIL,
          `${MOCK_MEMBER_EMAIL} already has an invite waiting.`,
        ],
        [
          TEAM_INVITE_FIELD_ERROR.SEAT_LIMIT,
          MOCK_MEMBER_EMAIL,
          'Every seat on Growth is in use.',
        ],
      ])(
        'shows the %s field error until the address changes',
        async (reason, email, message) => {
          inviteTeamMemberActionMock.mockResolvedValue(
            invalidEmail(reason, email),
          );

          await user.click(send);
          const error = await screen.findByText(message);

          expect(error).toBeVisible();

          const field = screen.getByLabelText(EMAIL_ADDRESS);
          await user.type(field, 'x');
          const clearedError = screen.queryByText(message);

          expect(clearedError).not.toBeInTheDocument();
        },
      );

      it('keeps the dialog open with the failure when the send fails', async () => {
        inviteTeamMemberActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });

        await user.click(send);
        const failure = await screen.findByText(
          "Couldn't send the invite — try again.",
        );
        const dialog = screen.getByRole('dialog');

        expect(failure).toBeVisible();
        expect(dialog).toBeVisible();
        expect(refresh).not.toHaveBeenCalled();
      });

      it('ignores Escape while the invite sends', async () => {
        inviteTeamMemberActionMock.mockReturnValue(new Promise(() => {}));

        await user.click(send);
        await user.keyboard(USER_EVENT_KEY.ESCAPE);
        const dialog = screen.getByRole('dialog');
        const cancel = screen.getByRole('button', { name: CANCEL });

        expect(dialog).toBeVisible();
        expect(cancel).toBeDisabled();
      });
    });
  });
});
