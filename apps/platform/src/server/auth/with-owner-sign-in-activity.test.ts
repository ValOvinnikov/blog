import { recordOwnerSignInActivity } from '@platform/server/tenants/record-owner-sign-in-activity';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import type { NextAuthConfig } from 'next-auth';

import { withOwnerSignInActivity } from './with-owner-sign-in-activity';

vi.mock('@platform/server/tenants/record-owner-sign-in-activity', () => ({
  recordOwnerSignInActivity: vi.fn(),
}));

type TSignInMessage = Parameters<
  NonNullable<NonNullable<NextAuthConfig['events']>['signIn']>
>[0];

const { userId: USER_ID } = mockMembership();
const MESSAGE: TSignInMessage = { user: { id: USER_ID }, account: null };

describe(withOwnerSignInActivity, () => {
  it('records owner activity for the signed-in user', async () => {
    const { events } = withOwnerSignInActivity({ providers: [] });

    await events?.signIn?.(MESSAGE);

    expect(recordOwnerSignInActivity).toHaveBeenCalledWith(USER_ID);
  });

  it('still runs the shared config sign-in event', async () => {
    const sharedSignIn = vi.fn();

    const { events } = withOwnerSignInActivity({
      providers: [],
      events: { signIn: sharedSignIn },
    });
    await events?.signIn?.(MESSAGE);

    expect(sharedSignIn).toHaveBeenCalledWith(MESSAGE);
  });

  it('records nothing for a user without an id', async () => {
    const { events } = withOwnerSignInActivity({ providers: [] });

    await events?.signIn?.({ user: {}, account: null });

    expect(recordOwnerSignInActivity).not.toHaveBeenCalled();
  });
});
