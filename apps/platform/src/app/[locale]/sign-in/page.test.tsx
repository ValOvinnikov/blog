import type * as oauthProviders from '@blog/auth/utils/oauth-providers/oauth-providers';
import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import {
  MOCK_OFF_ORIGIN_PATH,
  MOCK_SIGN_IN_USER_ID,
} from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
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

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const tPage = makeEnTranslator('signInPage');
const tProvider = makeEnTranslator('providerSignInButton');

const setup = customRenderAsync(SignInPage, {
  searchParams: Promise.resolve({ callbackUrl: adminRoutes.dashboard() }),
});

describe(`<${SignInPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue(null);
  });

  it('offers a signed-out visitor only the configured providers', async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: tPage('heading'),
    });
    const githubButton = screen.getByRole('button', {
      name: tProvider('continueWithGithub'),
    });
    const googleButton = screen.queryByRole('button', {
      name: tProvider('continueWithGoogle'),
    });

    expect(heading).toBeVisible();
    expect(githubButton).toBeVisible();
    expect(googleButton).not.toBeInTheDocument();
  });

  it('shows the error Auth.js sent back to sign-in', async () => {
    await setup({
      searchParams: Promise.resolve({ error: ACCOUNT_NOT_LINKED_AUTH_ERROR }),
    });

    const alert = screen.getByRole('alert');
    const alertTitle = screen.getByText(tPage('accountNotLinkedTitle'));

    expect(alert).toBeVisible();
    expect(alertTitle).toBeVisible();
  });

  it.each([
    [
      'on to the page they asked for',
      adminRoutes.dashboard(),
      adminRoutes.dashboard(),
    ],
    [
      'home when the requested page is off-site',
      MOCK_OFF_ORIGIN_PATH,
      adminRoutes.home(),
    ],
  ])('sends a signed-in user %s', async (_label, callbackUrl, expectedPath) => {
    authMock.mockResolvedValueOnce({ user: { id: MOCK_SIGN_IN_USER_ID } });

    await expect(
      setup({ searchParams: Promise.resolve({ callbackUrl }) }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(expectedPath);
  });
});
