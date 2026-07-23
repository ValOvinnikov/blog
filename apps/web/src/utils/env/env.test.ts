export {};

const ENV_KEYS = [
  'SANITY_REVALIDATE_SECRET',
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
    process.env['NEXT_PUBLIC_SITE_URL'] = 'https://example.com';
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'staging';

    const { env } = await importEnvOnServer();

    expect(env.SANITY_REVALIDATE_SECRET).toBe('revalidate-secret');
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

    await expect(importEnv()).rejects.toThrow();
  });

  it('throws when NEXT_PUBLIC_SANITY_PROJECT_ID is missing', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    await expect(importEnv()).rejects.toThrow();
  });

  it('throws when NEXT_PUBLIC_SANITY_DATASET is empty (no default)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = '';

    await expect(importEnv()).rejects.toThrow();
  });
});
