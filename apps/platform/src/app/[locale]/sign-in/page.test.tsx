import type * as oauthProviders from '@blog/auth/utils/oauth-providers/oauth-providers';
import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import {
  MOCK_OFF_ORIGIN_PATH,
  MOCK_SIGN_IN_USER_ID,
} from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import { ACCOUNT_NOT_LINKED_AUTH_ERROR } from '@platform/utils/sign-in-error/sign-in-error';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import SignInPage from './page';

vi.mock('@platform/server/auth/auth');

vi.mock(
  '@blog/auth/utils/oauth-providers/oauth-providers',
  async (importActual) => {
    const actual = await importActual<typeof oauthProviders>();
    return {
      ...actual,
      getEnabledOAuthProviderIds: vi.fn(() => [actual.OAUTH_PROVIDER_IDS[0]]),
    };
  },
);

vi.mock('@platform/server/auth/sign-in-with-provider-action', () => ({
  signInWithProviderAction: vi.fn(),
}));

vi.mock('@platform/server/auth/send-sign-in-link-action', () => ({
  sendSignInLinkAction: vi.fn(),
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(SignInPage, {
  searchParams: Promise.resolve({ callbackUrl: adminRoutes.dashboard() }),
});

describe('SignInPage', () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue(null);
  });

  it('offers a signed-out visitor only the configured providers', async () => {
    await setup();

    const heading = screen.getByRole('heading', { level: 1 });
    const providerButtons = screen.getAllByRole('button', {
      name: /^Continue with/,
    });

    expect(heading).toBeVisible();
    expect(providerButtons).toHaveLength(1);
  });

  it('shows the error Auth.js sent back to sign-in', async () => {
    await setup({
      searchParams: Promise.resolve({ error: ACCOUNT_NOT_LINKED_AUTH_ERROR }),
    });

    expect(screen.getByRole('alert')).toBeVisible();
  });

  it('sends a signed-in user on to the page they asked for', async () => {
    authMock.mockResolvedValue({ user: { id: MOCK_SIGN_IN_USER_ID } });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboard());
  });

  it('sends a signed-in user home when the requested page is off-site', async () => {
    authMock.mockResolvedValue({ user: { id: MOCK_SIGN_IN_USER_ID } });

    await expect(
      setup({
        searchParams: Promise.resolve({ callbackUrl: MOCK_OFF_ORIGIN_PATH }),
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.home());
  });
});
