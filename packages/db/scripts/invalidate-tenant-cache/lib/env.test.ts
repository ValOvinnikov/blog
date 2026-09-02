import { loadInvalidateCacheEnv } from './env';

const REQUIRED_ENV: Record<string, string> = {
  WEB_APP_URL: 'https://web.example.com',
  SITE_CONFIG_REVALIDATE_SECRET: 'shh',
};

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of Object.keys(REQUIRED_ENV)) {
    originalEnv[key] = process.env[key];
    process.env[key] = REQUIRED_ENV[key];
  }
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe(loadInvalidateCacheEnv, () => {
  it('resolves both required vars plus the given dryRun flag', () => {
    const env = loadInvalidateCacheEnv(true);

    expect(env).toEqual({
      webAppUrl: 'https://web.example.com',
      siteConfigRevalidateSecret: 'shh',
      dryRun: true,
    });
  });

  it('carries through dryRun=false', () => {
    const env = loadInvalidateCacheEnv(false);

    expect(env.dryRun).toBe(false);
  });

  it.each(Object.keys(REQUIRED_ENV))(
    'throws when %s is missing',
    (missingKey) => {
      delete process.env[missingKey];

      expect(() => loadInvalidateCacheEnv(true)).toThrow(
        `invalidate-tenant-cache: missing required env var ${missingKey}.`,
      );
    },
  );
});
