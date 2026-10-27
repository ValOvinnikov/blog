import {
  MOCK_GITHUB_ID,
  MOCK_GITHUB_SECRET,
  MOCK_GOOGLE_ID,
  MOCK_GOOGLE_SECRET,
} from '@blog/auth/testing/oauth-fixtures';

async function importOAuthEnv(): Promise<typeof import('./oauth-env')> {
  vi.resetModules();
  return import('./oauth-env');
}

describe('oauthEnv', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_GITHUB_ID', undefined);
    vi.stubEnv('AUTH_GITHUB_SECRET', undefined);
    vi.stubEnv('AUTH_GOOGLE_ID', undefined);
    vi.stubEnv('AUTH_GOOGLE_SECRET', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('leaves every credential undefined when none are set', async () => {
    const { oauthEnv } = await importOAuthEnv();

    expect([
      oauthEnv.AUTH_GITHUB_ID,
      oauthEnv.AUTH_GITHUB_SECRET,
      oauthEnv.AUTH_GOOGLE_ID,
      oauthEnv.AUTH_GOOGLE_SECRET,
    ]).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('exposes configured credentials by their exact env var names', async () => {
    vi.stubEnv('AUTH_GITHUB_ID', MOCK_GITHUB_ID);
    vi.stubEnv('AUTH_GITHUB_SECRET', MOCK_GITHUB_SECRET);
    vi.stubEnv('AUTH_GOOGLE_ID', MOCK_GOOGLE_ID);
    vi.stubEnv('AUTH_GOOGLE_SECRET', MOCK_GOOGLE_SECRET);

    const { oauthEnv } = await importOAuthEnv();

    expect([
      oauthEnv.AUTH_GITHUB_ID,
      oauthEnv.AUTH_GITHUB_SECRET,
      oauthEnv.AUTH_GOOGLE_ID,
      oauthEnv.AUTH_GOOGLE_SECRET,
    ]).toEqual([
      MOCK_GITHUB_ID,
      MOCK_GITHUB_SECRET,
      MOCK_GOOGLE_ID,
      MOCK_GOOGLE_SECRET,
    ]);
  });

  it('loads without AUTH_SECRET or skipped validation', async () => {
    vi.stubEnv('AUTH_SECRET', undefined);
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
    vi.stubEnv('AUTH_GITHUB_ID', MOCK_GITHUB_ID);

    const { oauthEnv } = await importOAuthEnv();

    expect(oauthEnv.AUTH_GITHUB_ID).toBe(MOCK_GITHUB_ID);
  });
});
