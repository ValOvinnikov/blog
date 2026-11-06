import {
  MOCK_GITHUB_ID,
  MOCK_GITHUB_SECRET,
  MOCK_GOOGLE_ID,
  MOCK_GOOGLE_SECRET,
  MOCK_SITE_GITHUB_CREDENTIALS,
  MOCK_SITE_GITHUB_ID,
  MOCK_SITE_GITHUB_SECRET,
} from '@blog/auth/testing/oauth-fixtures';
import { OAUTH_PROVIDER } from '@blog/config/constants';

import {
  getEnabledOAuthProviderIds,
  getOAuthProviderCredentials,
} from './oauth-providers';

const { GITHUB, GOOGLE } = OAUTH_PROVIDER;

async function importOAuthProviders(): Promise<
  typeof import('./oauth-providers')
> {
  vi.resetModules();
  return import('./oauth-providers');
}

const withGitHubCredentials = () => {
  vi.stubEnv('AUTH_GITHUB_ID', MOCK_GITHUB_ID);
  vi.stubEnv('AUTH_GITHUB_SECRET', MOCK_GITHUB_SECRET);
};

describe('oauth-providers', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_GITHUB_ID', undefined);
    vi.stubEnv('AUTH_GITHUB_SECRET', undefined);
    vi.stubEnv('AUTH_GOOGLE_ID', undefined);
    vi.stubEnv('AUTH_GOOGLE_SECRET', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe(getEnabledOAuthProviderIds, () => {
    it.each([
      ['the client id', 'AUTH_GITHUB_ID', MOCK_GITHUB_ID],
      ['the client secret', 'AUTH_GITHUB_SECRET', MOCK_GITHUB_SECRET],
    ])('excludes a provider with only %s of its pair set', (_, key, value) => {
      vi.stubEnv(key, value);

      expect(getEnabledOAuthProviderIds()).toEqual([]);
    });

    it('enables nothing when no credentials are set', () => {
      expect(getEnabledOAuthProviderIds()).toEqual([]);
    });

    it('includes a provider whose full credential pair is set', () => {
      withGitHubCredentials();

      expect(getEnabledOAuthProviderIds()).toEqual([GITHUB]);
    });

    it('includes a provider only the site has credentials for', () => {
      expect(getEnabledOAuthProviderIds(MOCK_SITE_GITHUB_CREDENTIALS)).toEqual([
        GITHUB,
      ]);
    });

    it('lists GitHub before Google when both are enabled', () => {
      withGitHubCredentials();
      vi.stubEnv('AUTH_GOOGLE_ID', MOCK_GOOGLE_ID);
      vi.stubEnv('AUTH_GOOGLE_SECRET', MOCK_GOOGLE_SECRET);

      expect(getEnabledOAuthProviderIds()).toEqual([GITHUB, GOOGLE]);
    });
  });

  describe(getOAuthProviderCredentials, () => {
    it('returns the credential pair when both are set', () => {
      withGitHubCredentials();

      expect(getOAuthProviderCredentials(GITHUB)).toEqual({
        clientId: MOCK_GITHUB_ID,
        clientSecret: MOCK_GITHUB_SECRET,
      });
    });

    it("prefers the site's own credentials over the env pair", () => {
      withGitHubCredentials();

      expect(
        getOAuthProviderCredentials(GITHUB, MOCK_SITE_GITHUB_CREDENTIALS),
      ).toEqual({
        clientId: MOCK_SITE_GITHUB_ID,
        clientSecret: MOCK_SITE_GITHUB_SECRET,
      });
    });

    it('falls back to the env pair for a provider the site has no credentials for', () => {
      vi.stubEnv('AUTH_GOOGLE_ID', MOCK_GOOGLE_ID);
      vi.stubEnv('AUTH_GOOGLE_SECRET', MOCK_GOOGLE_SECRET);

      expect(
        getOAuthProviderCredentials(GOOGLE, MOCK_SITE_GITHUB_CREDENTIALS),
      ).toEqual({ clientId: MOCK_GOOGLE_ID, clientSecret: MOCK_GOOGLE_SECRET });
    });

    it('returns undefined when the credential pair is incomplete', () => {
      vi.stubEnv('AUTH_GOOGLE_ID', MOCK_GOOGLE_ID);

      expect(getOAuthProviderCredentials(GOOGLE)).toBeUndefined();
    });
  });

  it('loads without AUTH_SECRET, so the OAuth buttons never need it', async () => {
    vi.stubEnv('AUTH_SECRET', undefined);
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
    withGitHubCredentials();

    const { getEnabledOAuthProviderIds } = await importOAuthProviders();

    expect(getEnabledOAuthProviderIds()).toEqual([GITHUB]);
  });
});
