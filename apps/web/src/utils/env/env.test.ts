export {};

const ENV_KEYS = [
  'SANITY_REVALIDATE_SECRET',
  'ANTHROPIC_API_KEY',
  'SANITY_GENERATE_SECRET',
  'VERCEL_ANALYTICS_ENABLED',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SKIP_ENV_VALIDATION',
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

// `env.ts` validates eagerly on import (createEnv runs at module evaluation),
// so each case needs a fresh module instance via resetModules + dynamic import.
async function importEnv(): Promise<typeof import('./env')> {
  vi.resetModules();
  return import('./env');
}

// The test environment is jsdom (a `window` global is present), so
// `env-nextjs` treats the module as running on the client and throws for
// server-only keys — this is the server/client boundary working as intended.
// `isServer` is decided once, at `createEnv()` (i.e. at import time), so
// simulating a server context requires removing `window` before importing.
async function importEnvOnServer(): Promise<typeof import('./env')> {
  const originalWindow = globalThis.window;
  // @ts-expect-error -- simulate a server (non-browser) runtime for this import
  delete globalThis.window;
  try {
    return await importEnv();
  } finally {
    globalThis.window = originalWindow;
  }
}

describe('env', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('parses a valid environment and exposes typed values', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['SANITY_REVALIDATE_SECRET'] = 'revalidate-secret';
    process.env['ANTHROPIC_API_KEY'] = 'anthropic-key';
    process.env['SANITY_GENERATE_SECRET'] = 'generate-secret';
    process.env['NEXT_PUBLIC_SITE_URL'] = 'https://example.com';
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'staging';

    const { env } = await importEnvOnServer();

    expect(env.SANITY_REVALIDATE_SECRET).toBe('revalidate-secret');
    expect(env.ANTHROPIC_API_KEY).toBe('anthropic-key');
    expect(env.SANITY_GENERATE_SECRET).toBe('generate-secret');
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://example.com');
    expect(env.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('abc123');
    expect(env.NEXT_PUBLIC_SANITY_DATASET).toBe('staging');
  });

  it('leaves SANITY_REVALIDATE_SECRET undefined when absent', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['SANITY_REVALIDATE_SECRET'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    const { env } = await importEnvOnServer();

    expect(env.SANITY_REVALIDATE_SECRET).toBeUndefined();
  });

  it('leaves ANTHROPIC_API_KEY and SANITY_GENERATE_SECRET undefined when absent (the skim pipeline stays disabled)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['ANTHROPIC_API_KEY'];
    delete process.env['SANITY_GENERATE_SECRET'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    const { env } = await importEnvOnServer();

    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.SANITY_GENERATE_SECRET).toBeUndefined();
  });

  it('leaves VERCEL_ANALYTICS_ENABLED undefined when absent (Analytics/SpeedInsights stay omitted)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['VERCEL_ANALYTICS_ENABLED'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    const { env } = await importEnvOnServer();

    expect(env.VERCEL_ANALYTICS_ENABLED).toBeUndefined();
  });

  it('parses VERCEL_ANALYTICS_ENABLED when set to "true"', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['VERCEL_ANALYTICS_ENABLED'] = 'true';
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    const { env } = await importEnvOnServer();

    expect(env.VERCEL_ANALYTICS_ENABLED).toBe('true');
  });

  it('throws when VERCEL_ANALYTICS_ENABLED is set to an unrecognized value', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['VERCEL_ANALYTICS_ENABLED'] = 'yes';
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    // `createEnv` logs `❌ Invalid environment variables: [...]` via
    // console.error before throwing — expected here, silenced so this
    // passing test's output stays clean.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(importEnvOnServer()).rejects.toThrow();

    errorSpy.mockRestore();
  });

  it('throws when SANITY_REVALIDATE_SECRET is read on the client', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['SANITY_REVALIDATE_SECRET'] = 'revalidate-secret';
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    const { env } = await importEnv();

    expect(() => env.SANITY_REVALIDATE_SECRET).toThrow();
  });

  it('leaves NEXT_PUBLIC_SITE_URL undefined when absent', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['NEXT_PUBLIC_SITE_URL'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    const { env } = await importEnv();

    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });

  it('throws when NEXT_PUBLIC_SITE_URL is not a valid URL', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['NEXT_PUBLIC_SITE_URL'] = 'not-a-url';
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(importEnv()).rejects.toThrow();

    errorSpy.mockRestore();
  });

  it('throws when NEXT_PUBLIC_SANITY_PROJECT_ID is missing', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(importEnv()).rejects.toThrow();

    errorSpy.mockRestore();
  });

  it('throws when NEXT_PUBLIC_SANITY_DATASET is empty (no default)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = '';

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(importEnv()).rejects.toThrow();

    errorSpy.mockRestore();
  });
});
