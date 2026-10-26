import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { requireSessionUserId } from '@platform/server/auth/require-session-user-id';
import { resolveUserHomeHref } from '@platform/server/auth/resolve-home-href';
import {
  MOCK_SIGN_IN_HREF,
  MOCK_SIGN_IN_USER_ID,
} from '@platform/testing/auth/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

import { requireOnboardingUser } from './require-onboarding-user';

vi.mock('@platform/server/auth/require-session-user-id', () => ({
  requireSessionUserId: vi.fn(),
}));

vi.mock('@platform/server/auth/resolve-home-href', () => ({
  resolveUserHomeHref: vi.fn(),
}));

const requireSessionUserIdMock = vi.mocked(requireSessionUserId);
const resolveUserHomeHrefMock = vi.mocked(resolveUserHomeHref);

describe(requireOnboardingUser, () => {
  beforeEach(() => {
    requireSessionUserIdMock.mockResolvedValue(MOCK_SIGN_IN_USER_ID);
    resolveUserHomeHrefMock.mockResolvedValue(adminRoutes.onboarding());
  });

  it('sends a signed-out visitor to sign-in', async () => {
    requireSessionUserIdMock.mockImplementation(() =>
      redirect(MOCK_SIGN_IN_HREF),
    );

    await expect(requireOnboardingUser()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );
    expect(resolveUserHomeHrefMock).not.toHaveBeenCalled();
  });

  it.each([adminRoutes.tenants(), adminRoutes.dashboard()])(
    'sends a user whose home is %s there instead',
    async (homeHref) => {
      resolveUserHomeHrefMock.mockResolvedValue(homeHref);

      await expect(requireOnboardingUser()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );
      expect(redirect).toHaveBeenCalledWith(homeHref);
    },
  );

  it('lets a user with no membership through', async () => {
    await expect(requireOnboardingUser()).resolves.toBe(MOCK_SIGN_IN_USER_ID);
  });
});
