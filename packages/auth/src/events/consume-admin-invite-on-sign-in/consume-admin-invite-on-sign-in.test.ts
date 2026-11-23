import { MOCK_DB_ERROR_MESSAGE } from '@shinefold/auth/testing/magic-link-fixtures';
import {
  MOCK_EMAIL,
  MOCK_USER_ID,
} from '@shinefold/auth/testing/session-fixtures';

import { consumeAdminInviteOnSignIn } from './consume-admin-invite-on-sign-in';

const { consumeAdminInviteMock } = vi.hoisted(() => ({
  consumeAdminInviteMock: vi.fn(),
}));

vi.mock('@shinefold/db', () => ({
  queries: { adminInvites: { consumeAdminInvite: consumeAdminInviteMock } },
}));

describe(consumeAdminInviteOnSignIn, () => {
  it("consumes the signed-in email's admin invite for the user", async () => {
    await consumeAdminInviteOnSignIn({
      user: { id: MOCK_USER_ID, email: MOCK_EMAIL },
    });

    expect(consumeAdminInviteMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_EMAIL,
      MOCK_USER_ID,
    );
  });

  it.each([
    ['resolved id', { email: MOCK_EMAIL }],
    ['email', { id: MOCK_USER_ID }],
  ])('consumes nothing when the user has no %s', async (_, user) => {
    await consumeAdminInviteOnSignIn({ user });

    expect(consumeAdminInviteMock).not.toHaveBeenCalled();
  });

  it('resolves without rethrowing when consuming throws', async () => {
    consumeAdminInviteMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    await expect(
      consumeAdminInviteOnSignIn({
        user: { id: MOCK_USER_ID, email: MOCK_EMAIL },
      }),
    ).resolves.toBeUndefined();
  });
});
