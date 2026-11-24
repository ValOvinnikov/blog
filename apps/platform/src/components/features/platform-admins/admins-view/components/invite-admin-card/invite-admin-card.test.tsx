import { ADMIN_INVITE_FIELD_ERROR } from '@platform/constants/platform-admins';
import messages from '@platform/i18n/messages/en.json';
import { inviteAdminAction } from '@platform/server/platform-admins/invite-admin-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_INVITED_ADMIN_EMAIL } from '@platform/testing/platform-admins/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { InviteAdminCard } from './invite-admin-card';

vi.mock('@platform/server/platform-admins/invite-admin-action');

const { inviteAdminCard, roleLabel } = messages;
const t = makeEnTranslator('inviteAdminCard');
const EMAIL_FIELD = { name: inviteAdminCard.emailLabel };
const SEND_BUTTON = { name: inviteAdminCard.send };

const setup = customRender(InviteAdminCard, {});

describe(`<${InviteAdminCard.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(async () => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setup();

    const emailField = screen.getByRole('textbox', EMAIL_FIELD);
    await user.type(emailField, MOCK_INVITED_ADMIN_EMAIL);
  });

  it('invites the address as an admin by default, then clears the form', async () => {
    const send = screen.getByRole('button', SEND_BUTTON);
    await user.click(send);

    const emailField = await screen.findByRole('textbox', EMAIL_FIELD);

    expect(inviteAdminAction).toHaveBeenCalledWith({
      email: MOCK_INVITED_ADMIN_EMAIL,
      role: ADMIN_ROLE.ADMIN,
    });
    expect(emailField).toHaveValue('');
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('offers only Admin and Super admin, and invites with the role chosen', async () => {
    const roleSelect = screen.getByRole('combobox', {
      name: inviteAdminCard.roleLabel,
    });
    await user.click(roleSelect);

    const options = screen.getAllByRole('option');
    const superAdmin = screen.getByRole('option', {
      name: roleLabel.SUPERADMIN,
    });
    await user.click(superAdmin);
    const send = screen.getByRole('button', SEND_BUTTON);
    await user.click(send);

    expect(options).toHaveLength(2);
    expect(inviteAdminAction).toHaveBeenCalledWith({
      email: MOCK_INVITED_ADMIN_EMAIL,
      role: ADMIN_ROLE.SUPERADMIN,
    });
  });

  it('names an address that is already an admin and keeps the input', async () => {
    vi.mocked(inviteAdminAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        email: {
          reason: ADMIN_INVITE_FIELD_ERROR.ALREADY_ADMIN,
          values: { email: MOCK_INVITED_ADMIN_EMAIL },
        },
      },
    });

    const send = screen.getByRole('button', SEND_BUTTON);
    await user.click(send);

    const error = await screen.findByText(
      t(`fieldError.${ADMIN_INVITE_FIELD_ERROR.ALREADY_ADMIN}`, {
        email: MOCK_INVITED_ADMIN_EMAIL,
      }),
    );
    const emailField = screen.getByRole('textbox', EMAIL_FIELD);

    expect(error).toBeVisible();
    expect(emailField).toHaveValue(MOCK_INVITED_ADMIN_EMAIL);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('says the invite was not kept when its email could not be sent', async () => {
    vi.mocked(inviteAdminAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    const send = screen.getByRole('button', SEND_BUTTON);
    await user.click(send);

    const error = await screen.findByText(inviteAdminCard.sendFailed);
    const emailField = screen.getByRole('textbox', EMAIL_FIELD);

    expect(error).toBeVisible();
    expect(emailField).toHaveValue(MOCK_INVITED_ADMIN_EMAIL);
    expect(refresh).not.toHaveBeenCalled();
  });
});
