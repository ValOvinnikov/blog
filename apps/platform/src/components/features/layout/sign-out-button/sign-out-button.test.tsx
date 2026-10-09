import { signOutAction } from '@platform/server/auth/sign-out-action';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { SignOutButton } from './sign-out-button';

vi.mock('@platform/server/auth/sign-out-action');

describe(SignOutButton, () => {
  it('signs out when clicked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SignOutButton />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(signOutAction).toHaveBeenCalledOnce();
  });
});
