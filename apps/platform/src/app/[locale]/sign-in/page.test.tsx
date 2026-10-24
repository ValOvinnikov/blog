import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { ACCOUNT_NOT_LINKED_AUTH_ERROR } from '@platform/utils/sign-in-error/sign-in-error';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import SignInPage from './page';

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/auth/utils/oauth-providers/oauth-providers', () => ({
  getEnabledOAuthProviderIds: vi.fn(() => ['github']),
}));

vi.mock('@platform/server/auth/sign-in-with-provider-action', () => ({
  signInWithProviderAction: vi.fn(),
}));

vi.mock('@platform/server/auth/send-sign-in-link-action', () => ({
  sendSignInLinkAction: vi.fn(),
}));

const MOCK_CALLBACK_PATH = '/dashboard';

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(SignInPage, {
  searchParams: Promise.resolve({ callbackUrl: MOCK_CALLBACK_PATH }),
});

describe('SignInPage', () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue(null);
  });

  it('shows a signed-out visitor the configured ways to sign in', async () => {
    await setup();

    const heading = screen.getByRole('heading', { level: 1, name: 'Sign in' });
    const github = screen.getByRole('button', { name: 'Continue with GitHub' });
    const google = screen.queryByRole('button', {
      name: 'Continue with Google',
    });

    expect(heading).toBeVisible();
    expect(github).toBeVisible();
    expect(google).not.toBeInTheDocument();
  });

  it("shows Auth.js's linked-account error with its own message", async () => {
    await setup({
      searchParams: Promise.resolve({ error: ACCOUNT_NOT_LINKED_AUTH_ERROR }),
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This email already signs in another way',
    );
  });

  it('sends a signed-in user on to the page they asked for', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(MOCK_CALLBACK_PATH);
  });

  it('sends a signed-in user home when the requested page is off-site', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    await expect(
      setup({
        searchParams: Promise.resolve({ callbackUrl: '//evil.example' }),
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/');
  });
});
