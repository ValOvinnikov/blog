import { signOut } from '@platform/server/auth/auth';

import { signOutAction } from './sign-out-action';

vi.mock('@platform/server/auth/auth');

describe(signOutAction, () => {
  it('signs the session out and sends the user to sign-in', async () => {
    await signOutAction();

    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/api/auth/signin' });
  });
});
