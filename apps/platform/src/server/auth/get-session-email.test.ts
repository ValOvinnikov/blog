import type { TMaybeNull } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import {
  MOCK_SIGN_IN_EMAIL,
  MOCK_SIGN_IN_USER_ID,
} from '@platform/testing/auth/fixtures';
import type { Session } from 'next-auth';

import { getSessionEmail } from './get-session-email';

vi.mock('@platform/server/auth/auth');

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

describe(getSessionEmail, () => {
  it('returns the signed-in user email', async () => {
    authMock.mockResolvedValueOnce({
      user: { id: MOCK_SIGN_IN_USER_ID, email: MOCK_SIGN_IN_EMAIL },
    });

    await expect(getSessionEmail()).resolves.toBe(MOCK_SIGN_IN_EMAIL);
  });

  it('returns undefined for a signed-out visitor', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(getSessionEmail()).resolves.toBeUndefined();
  });
});
