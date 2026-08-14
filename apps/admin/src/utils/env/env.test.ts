export {};

const ENV_KEYS = [
  'RESEND_API_KEY',
  'BLOB_READ_WRITE_TOKEN',
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

  it('parses a valid RESEND_API_KEY and exposes it typed', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['RESEND_API_KEY'] = 'resend-key';

    const { env } = await importEnvOnServer();

    expect(env.RESEND_API_KEY).toBe('resend-key');
  });

  it('leaves RESEND_API_KEY undefined when absent (magic-link sign-in stays unavailable)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['RESEND_API_KEY'];

    const { env } = await importEnvOnServer();

    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('never throws at import time when RESEND_API_KEY is absent', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['RESEND_API_KEY'];

    await expect(importEnvOnServer()).resolves.toBeDefined();
  });

  it('skips validation entirely when SKIP_ENV_VALIDATION is set', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';
    delete process.env['RESEND_API_KEY'];

    await expect(importEnvOnServer()).resolves.toBeDefined();
  });

  it('parses a valid BLOB_READ_WRITE_TOKEN and exposes it typed', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['BLOB_READ_WRITE_TOKEN'] = 'vercel_blob_rw_store_token';

    const { env } = await importEnvOnServer();

    expect(env.BLOB_READ_WRITE_TOKEN).toBe('vercel_blob_rw_store_token');
  });

  it('leaves BLOB_READ_WRITE_TOKEN undefined when absent (uploads stay unavailable)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['BLOB_READ_WRITE_TOKEN'];

    const { env } = await importEnvOnServer();

    expect(env.BLOB_READ_WRITE_TOKEN).toBeUndefined();
  });

  it('never throws at import time when BLOB_READ_WRITE_TOKEN is absent', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['BLOB_READ_WRITE_TOKEN'];

    await expect(importEnvOnServer()).resolves.toBeDefined();
  });
});
