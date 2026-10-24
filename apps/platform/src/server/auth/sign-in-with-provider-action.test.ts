import { signIn } from '@platform/server/auth/auth';

import { signInWithProviderAction } from './sign-in-with-provider-action';

const { MOCK_PROVIDER_ID } = vi.hoisted(() => ({
  MOCK_PROVIDER_ID: 'github' as const,
}));
const MOCK_CALLBACK_PATH = '/dashboard';

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/auth/utils/oauth-providers/oauth-providers', () => ({
  getEnabledOAuthProviderIds: vi.fn(() => [MOCK_PROVIDER_ID]),
}));

describe(signInWithProviderAction, () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it('starts the provider sign-in, returning to the requested page', async () => {
    await signInWithProviderAction({
      providerId: MOCK_PROVIDER_ID,
      callbackPath: MOCK_CALLBACK_PATH,
    });

    expect(signIn).toHaveBeenCalledWith(MOCK_PROVIDER_ID, {
      redirectTo: MOCK_CALLBACK_PATH,
    });
  });

  it('returns a sign-in that would leave this origin to home instead', async () => {
    await signInWithProviderAction({
      providerId: MOCK_PROVIDER_ID,
      callbackPath: 'https://evil.example/',
    });

    expect(signIn).toHaveBeenCalledWith(MOCK_PROVIDER_ID, { redirectTo: '/' });
  });

  it('ignores a provider that is not configured', async () => {
    await signInWithProviderAction({
      providerId: 'google',
      callbackPath: MOCK_CALLBACK_PATH,
    });

    expect(signIn).not.toHaveBeenCalled();
  });
});
