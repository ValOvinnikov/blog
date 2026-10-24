import type * as oauthProviders from '@blog/auth/utils/oauth-providers/oauth-providers';
import { OAUTH_PROVIDER_IDS } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { signIn } from '@platform/server/auth/auth';
import { MOCK_OFF_ORIGIN_URL } from '@platform/testing/auth/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { signInWithProviderAction } from './sign-in-with-provider-action';

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

const [ENABLED_PROVIDER_ID, DISABLED_PROVIDER_ID] = OAUTH_PROVIDER_IDS;

describe(signInWithProviderAction, () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it('starts the provider sign-in, returning to the requested page', async () => {
    await signInWithProviderAction({
      providerId: ENABLED_PROVIDER_ID,
      callbackPath: adminRoutes.dashboard(),
    });

    expect(signIn).toHaveBeenCalledWith(ENABLED_PROVIDER_ID, {
      redirectTo: adminRoutes.dashboard(),
    });
  });

  it('returns a sign-in that would leave this origin to home instead', async () => {
    await signInWithProviderAction({
      providerId: ENABLED_PROVIDER_ID,
      callbackPath: MOCK_OFF_ORIGIN_URL,
    });

    expect(signIn).toHaveBeenCalledWith(ENABLED_PROVIDER_ID, {
      redirectTo: adminRoutes.home(),
    });
  });

  it('ignores a provider that is not configured', async () => {
    await signInWithProviderAction({
      providerId: DISABLED_PROVIDER_ID,
      callbackPath: adminRoutes.dashboard(),
    });

    expect(signIn).not.toHaveBeenCalled();
  });
});
