import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { MOCK_SIGN_IN_USER_ID } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import SignUpPage from './page';

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/auth/accept-signup-terms-action', () => ({
  acceptSignupTermsAction: vi.fn(),
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(SignUpPage, {});

describe('SignUpPage', () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue(null);
  });

  it('asks a signed-out visitor to accept the terms', async () => {
    await setup();

    const heading = screen.getByRole('heading', { level: 1 });
    const acceptance = screen.getByRole('checkbox');

    expect(heading).toBeVisible();
    expect(acceptance).toBeVisible();
  });

  it('sends a signed-in user home', async () => {
    authMock.mockResolvedValue({ user: { id: MOCK_SIGN_IN_USER_ID } });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.home());
  });
});
