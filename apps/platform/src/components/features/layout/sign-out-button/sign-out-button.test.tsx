import messages from '@platform/i18n/messages/en.json';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { SignOutButton } from './sign-out-button';

vi.mock('@platform/server/auth/sign-out-action');

const setup = customRender(SignOutButton, {});

describe(`<${SignOutButton.name}/>`, () => {
  it('signs out when clicked', async () => {
    const user = userEvent.setup();
    setup();

    const signOutButton = screen.getByRole('button', {
      name: messages.account.signOut,
    });
    await user.click(signOutButton);

    expect(signOutAction).toHaveBeenCalledOnce();
  });
});
