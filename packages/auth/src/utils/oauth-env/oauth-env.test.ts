export {};

const ENV_KEYS = [
  'AUTH_GITHUB_ID',
  'AUTH_GITHUB_SECRET',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function importOAuthEnv(): Promise<typeof import('./oauth-env')> {
  vi.resetModules();
  return import('./oauth-env');
}

describe('oauthEnv', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('leaves every credential undefined when none are set', async () => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }

    const { oauthEnv } = await importOAuthEnv();

    expect(oauthEnv.AUTH_GITHUB_ID).toBeUndefined();
    expect(oauthEnv.AUTH_GITHUB_SECRET).toBeUndefined();
    expect(oauthEnv.AUTH_GOOGLE_ID).toBeUndefined();
    expect(oauthEnv.AUTH_GOOGLE_SECRET).toBeUndefined();
  });

  it('exposes configured credentials by their exact env var names', async () => {
    process.env['AUTH_GITHUB_ID'] = 'github-id';
    process.env['AUTH_GITHUB_SECRET'] = 'github-secret';
    process.env['AUTH_GOOGLE_ID'] = 'google-id';
    process.env['AUTH_GOOGLE_SECRET'] = 'google-secret';

    const { oauthEnv } = await importOAuthEnv();

    expect(oauthEnv.AUTH_GITHUB_ID).toBe('github-id');
    expect(oauthEnv.AUTH_GITHUB_SECRET).toBe('github-secret');
    expect(oauthEnv.AUTH_GOOGLE_ID).toBe('google-id');
    expect(oauthEnv.AUTH_GOOGLE_SECRET).toBe('google-secret');
  });

  it('does not require AUTH_SECRET, unlike @blog/auth/utils/env/env', async () => {
    const previousAuthSecret = process.env['AUTH_SECRET'];
    const previousSkipValidation = process.env['SKIP_ENV_VALIDATION'];
    delete process.env['AUTH_SECRET'];
    delete process.env['SKIP_ENV_VALIDATION'];

    try {
      await expect(importOAuthEnv()).resolves.toBeDefined();
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
