import { signOutAction } from '@platform/server/auth/sign-out-action';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { AccountMenu } from './account-menu';

vi.mock('@platform/server/auth/sign-out-action');

describe(AccountMenu, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    renderWithIntl(<AccountMenu name="Jane Doe" label="Owner · Acme" />);
  });

  it('opens a menu from the role chip that offers sign out', async () => {
    await user.click(screen.getByRole('button', { name: 'Owner · Acme' }));

    expect(
      await screen.findByRole('menuitem', { name: 'Sign out' }),
    ).toBeVisible();
  });

  it('signs out when the sign out item is chosen', async () => {
    await user.click(screen.getByRole('button', { name: 'Owner · Acme' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(signOutAction).toHaveBeenCalledOnce();
  });
});
