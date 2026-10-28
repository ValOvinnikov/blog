import messages from '@platform/i18n/messages/en.json';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SignedInAccount } from './signed-in-account';

vi.mock('@platform/server/auth/sign-out-action');

const setup = customRender(SignedInAccount, { email: MOCK_SIGN_IN_EMAIL });

describe(`<${SignedInAccount.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  it('names the signed-in email', () => {
    const email = screen.getByText(MOCK_SIGN_IN_EMAIL, { exact: false });

    expect(email).toBeVisible();
  });

  it('signs out when its button is clicked', async () => {
    const signOutButton = screen.getByRole('button', {
      name: messages.account.signOut,
    });
    await user.click(signOutButton);

    expect(signOutAction).toHaveBeenCalledOnce();
  });
});
