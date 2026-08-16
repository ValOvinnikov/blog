export {};

const ENV_KEYS = [
  'RESEND_API_KEY',
  'BLOB_READ_WRITE_TOKEN',
  'WEB_APP_URL',
  'SITE_CONFIG_REVALIDATE_SECRET',
  'TENANT_PROVISIONING_GITHUB_TOKEN',
  'TENANT_PROVISIONING_CALLBACK_SECRET',
  'VERCEL_API_TOKEN',
  'VERCEL_WEB_PROJECT_ID',
  'VERCEL_TEAM_ID',
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

  it('parses a valid WEB_APP_URL and exposes it typed', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['WEB_APP_URL'] = 'https://example.com';

    const { env } = await importEnvOnServer();

    expect(env.WEB_APP_URL).toBe('https://example.com');
  });

  it('leaves WEB_APP_URL undefined when absent (revalidation calls are skipped)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['WEB_APP_URL'];

    const { env } = await importEnvOnServer();

    expect(env.WEB_APP_URL).toBeUndefined();
  });

  it('parses a valid SITE_CONFIG_REVALIDATE_SECRET and exposes it typed', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['SITE_CONFIG_REVALIDATE_SECRET'] = 'shared-secret';

    const { env } = await importEnvOnServer();

    expect(env.SITE_CONFIG_REVALIDATE_SECRET).toBe('shared-secret');
  });

  it('leaves SITE_CONFIG_REVALIDATE_SECRET undefined when absent (revalidation calls are skipped)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['SITE_CONFIG_REVALIDATE_SECRET'];

    const { env } = await importEnvOnServer();

    expect(env.SITE_CONFIG_REVALIDATE_SECRET).toBeUndefined();
  });

  it('never throws at import time when WEB_APP_URL/SITE_CONFIG_REVALIDATE_SECRET are absent', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['WEB_APP_URL'];
    delete process.env['SITE_CONFIG_REVALIDATE_SECRET'];

    await expect(importEnvOnServer()).resolves.toBeDefined();
  });

  it('parses a valid TENANT_PROVISIONING_GITHUB_TOKEN and exposes it typed', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['TENANT_PROVISIONING_GITHUB_TOKEN'] = 'ghp_token';

    const { env } = await importEnvOnServer();

    expect(env.TENANT_PROVISIONING_GITHUB_TOKEN).toBe('ghp_token');
  });

  it('leaves TENANT_PROVISIONING_GITHUB_TOKEN undefined when absent (dispatch is skipped)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['TENANT_PROVISIONING_GITHUB_TOKEN'];

    const { env } = await importEnvOnServer();

    expect(env.TENANT_PROVISIONING_GITHUB_TOKEN).toBeUndefined();
  });

  it('parses a valid TENANT_PROVISIONING_CALLBACK_SECRET and exposes it typed', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['TENANT_PROVISIONING_CALLBACK_SECRET'] = 'callback-secret';

    const { env } = await importEnvOnServer();

    expect(env.TENANT_PROVISIONING_CALLBACK_SECRET).toBe('callback-secret');
  });

  it('leaves TENANT_PROVISIONING_CALLBACK_SECRET undefined when absent (the callback route 500s)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['TENANT_PROVISIONING_CALLBACK_SECRET'];

    const { env } = await importEnvOnServer();

    expect(env.TENANT_PROVISIONING_CALLBACK_SECRET).toBeUndefined();
  });

  it('parses valid Vercel domain-check vars and exposes them typed', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['VERCEL_API_TOKEN'] = 'vercel-token';
    process.env['VERCEL_WEB_PROJECT_ID'] = 'prj_123';
    process.env['VERCEL_TEAM_ID'] = 'team_123';

    const { env } = await importEnvOnServer();

    expect(env.VERCEL_API_TOKEN).toBe('vercel-token');
    expect(env.VERCEL_WEB_PROJECT_ID).toBe('prj_123');
    expect(env.VERCEL_TEAM_ID).toBe('team_123');
  });

  it('leaves Vercel domain-check vars undefined when absent (the status page skips the live check)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['VERCEL_API_TOKEN'];
    delete process.env['VERCEL_WEB_PROJECT_ID'];
    delete process.env['VERCEL_TEAM_ID'];

    const { env } = await importEnvOnServer();

    expect(env.VERCEL_API_TOKEN).toBeUndefined();
    expect(env.VERCEL_WEB_PROJECT_ID).toBeUndefined();
    expect(env.VERCEL_TEAM_ID).toBeUndefined();
  });
});
