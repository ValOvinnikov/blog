import {
  MOCK_GITHUB_ID,
  MOCK_GITHUB_SECRET,
  MOCK_GOOGLE_ID,
  MOCK_GOOGLE_SECRET,
} from '@blog/auth/testing/oauth-fixtures';

async function importOAuthProviders(): Promise<
  typeof import('./oauth-providers')
> {
  vi.resetModules();
  return import('./oauth-providers');
}

describe('oauth-providers', () => {
  afterEach(() => {
    delete process.env['AUTH_GITHUB_ID'];
    delete process.env['AUTH_GITHUB_SECRET'];
    delete process.env['AUTH_GOOGLE_ID'];
    delete process.env['AUTH_GOOGLE_SECRET'];
  });

  describe('getEnabledOAuthProviderIds', () => {
    it.each([
      ['client id', 'AUTH_GITHUB_ID', MOCK_GITHUB_ID, 'github'],
      ['client secret', 'AUTH_GOOGLE_SECRET', MOCK_GOOGLE_SECRET, 'google'],
    ])(
      'excludes an id when only the %s half of its pair is present',
      async (_half, envKey, value, providerId) => {
        process.env[envKey] = value;
        const { getEnabledOAuthProviderIds } = await importOAuthProviders();

        expect(getEnabledOAuthProviderIds()).not.toContain(providerId);
      },
    );

    it('excludes an id when neither credential is present', async () => {
      const { getEnabledOAuthProviderIds } = await importOAuthProviders();

      expect(getEnabledOAuthProviderIds()).not.toEqual(
        expect.arrayContaining(['github', 'google']),
      );
    });

    describe('with the GitHub credential pair set', () => {
      beforeEach(() => {
        process.env['AUTH_GITHUB_ID'] = MOCK_GITHUB_ID;
        process.env['AUTH_GITHUB_SECRET'] = MOCK_GITHUB_SECRET;
      });

      it('includes an id when its full credential pair is present', async () => {
        const { getEnabledOAuthProviderIds } = await importOAuthProviders();

        expect(getEnabledOAuthProviderIds()).toContain('github');
      });

      it('orders enabled ids GitHub before Google, matching config.ts registration order', async () => {
        process.env['AUTH_GOOGLE_ID'] = MOCK_GOOGLE_ID;
        process.env['AUTH_GOOGLE_SECRET'] = MOCK_GOOGLE_SECRET;
        const { getEnabledOAuthProviderIds } = await importOAuthProviders();

        expect(getEnabledOAuthProviderIds()).toEqual(['github', 'google']);
      });
    });
  });

  describe('getOAuthProviderCredentials', () => {
    it('returns the credential pair when both are set', async () => {
      process.env['AUTH_GITHUB_ID'] = MOCK_GITHUB_ID;
      process.env['AUTH_GITHUB_SECRET'] = MOCK_GITHUB_SECRET;
      const { getOAuthProviderCredentials } = await importOAuthProviders();

      expect(getOAuthProviderCredentials('github')).toEqual({
        clientId: MOCK_GITHUB_ID,
        clientSecret: MOCK_GITHUB_SECRET,
      });
    });

    it('returns undefined when the credential pair is incomplete', async () => {
      process.env['AUTH_GOOGLE_ID'] = MOCK_GOOGLE_ID;
      const { getOAuthProviderCredentials } = await importOAuthProviders();

      expect(getOAuthProviderCredentials('google')).toBeUndefined();
    });
  });

  describe('module import', () => {
    it('does not require AUTH_SECRET, so a route rendering just the OAuth buttons never needs it', async () => {
      const previousAuthSecret = process.env['AUTH_SECRET'];
      const previousSkipValidation = process.env['SKIP_ENV_VALIDATION'];
      delete process.env['AUTH_SECRET'];
      delete process.env['SKIP_ENV_VALIDATION'];

      try {
        await expect(importOAuthProviders()).resolves.toBeDefined();
      } finally {
        if (previousAuthSecret === undefined) {
          delete process.env['AUTH_SECRET'];
        } else {
          process.env['AUTH_SECRET'] = previousAuthSecret;
        }
        if (previousSkipValidation === undefined) {
          delete process.env['SKIP_ENV_VALIDATION'];
        } else {
          process.env['SKIP_ENV_VALIDATION'] = previousSkipValidation;
        }
      }
    });
  });
});
