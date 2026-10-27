import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { REQUESTED_PATH_HEADER } from '@platform/utils/requested-path/requested-path';
import { adminRoutes } from '@platform/utils/routes/routes';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { requireSessionUserId } from './require-session-user-id';

vi.mock('@platform/server/auth/auth');

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

describe(requireSessionUserId, () => {
  it('returns the signed-in user id', async () => {
    authMock.mockResolvedValueOnce({ user: { id: MOCK_USER_ID } });

    await expect(requireSessionUserId()).resolves.toBe(MOCK_USER_ID);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor to sign-in, returning to the page they asked for', async () => {
    authMock.mockResolvedValueOnce(null);
    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ [REQUESTED_PATH_HEADER]: adminRoutes.dashboardLeads() }),
    );

    await expect(requireSessionUserId()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(
      adminRoutes.signIn(adminRoutes.dashboardLeads()),
    );
  });

  it('returns a signed-out visitor to home when the requested page is unknown', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(requireSessionUserId()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
  });
});
