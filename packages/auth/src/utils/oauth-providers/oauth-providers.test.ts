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
    it('includes an id when its full credential pair is present', async () => {
      process.env['AUTH_GITHUB_ID'] = 'github-id';
      process.env['AUTH_GITHUB_SECRET'] = 'github-secret';
      const { getEnabledOAuthProviderIds } = await importOAuthProviders();

      expect(getEnabledOAuthProviderIds()).toContain('github');
    });

    it('excludes an id when only the client id half of its pair is present', async () => {
      process.env['AUTH_GITHUB_ID'] = 'github-id';
      const { getEnabledOAuthProviderIds } = await importOAuthProviders();

      expect(getEnabledOAuthProviderIds()).not.toContain('github');
    });

    it('excludes an id when only the client secret half of its pair is present', async () => {
      process.env['AUTH_GOOGLE_SECRET'] = 'google-secret';
      const { getEnabledOAuthProviderIds } = await importOAuthProviders();

      expect(getEnabledOAuthProviderIds()).not.toContain('google');
    });

    it('excludes an id when neither credential is present', async () => {
      const { getEnabledOAuthProviderIds } = await importOAuthProviders();

      expect(getEnabledOAuthProviderIds()).not.toEqual(
        expect.arrayContaining(['github', 'google']),
      );
    });

    it('orders enabled ids GitHub before Google, matching config.ts registration order', async () => {
      process.env['AUTH_GITHUB_ID'] = 'github-id';
      process.env['AUTH_GITHUB_SECRET'] = 'github-secret';
      process.env['AUTH_GOOGLE_ID'] = 'google-id';
      process.env['AUTH_GOOGLE_SECRET'] = 'google-secret';
      const { getEnabledOAuthProviderIds } = await importOAuthProviders();

      expect(getEnabledOAuthProviderIds()).toEqual(['github', 'google']);
    });
  });

  describe('getOAuthProviderCredentials', () => {
    it('returns the credential pair when both are set', async () => {
      process.env['AUTH_GITHUB_ID'] = 'github-id';
      process.env['AUTH_GITHUB_SECRET'] = 'github-secret';
      const { getOAuthProviderCredentials } = await importOAuthProviders();

      expect(getOAuthProviderCredentials('github')).toEqual({
        clientId: 'github-id',
        clientSecret: 'github-secret',
      });
    });

    it('returns undefined when the credential pair is incomplete', async () => {
      process.env['AUTH_GOOGLE_ID'] = 'google-id';
      const { getOAuthProviderCredentials } = await importOAuthProviders();

      expect(getOAuthProviderCredentials('google')).toBeUndefined();
    });
  });
});
