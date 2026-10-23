import { KEY_ENCODING } from '@blog/utils/encryption';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';

const RESEND_KEY = 'resend-key';
const WEB_URL = 'https://example.com';
const REVALIDATE_SECRET = 'shared-secret';
const GITHUB_REPO = 'acme-org/acme-repo';
const WORKER_URL = 'https://worker-dev.example.com';
const VERCEL_TOKEN = 'vercel-token';
const VERCEL_PROJECT = 'prj_123';
const VERCEL_TEAM = 'team_123';
const SHORT_KEY = Buffer.alloc(16).toString(KEY_ENCODING);

const ENV_KEYS = [
  'RESEND_API_KEY',
  'BLOB_READ_WRITE_TOKEN',
  'WEB_APP_URL',
  'SITE_CONFIG_REVALIDATE_SECRET',
  'TENANT_PROVISIONING_GITHUB_TOKEN',
  'TENANT_PROVISIONING_GITHUB_REPO',
  'WORKER_ENQUEUE_URL',
  'VERCEL_API_TOKEN',
  'VERCEL_PROJECT_ID_WEB',
  'VERCEL_TEAM_ID',
  'SKIP_ENV_VALIDATION',
  'PERSONAL_DATA_ENCRYPTION_KEY',
  'PERSONAL_DATA_INDEX_KEY',
  'AUTH_SECRET',
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

const restoreEnv = (): void => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const importEnv = async (): Promise<typeof import('./env')> => {
  vi.resetModules();
  return import('./env');
};

const importEnvOnServer = async (): Promise<typeof import('./env')> => {
  const originalWindow = globalThis.window;
  // @ts-expect-error -- simulate a server (non-browser) runtime for this import
  delete globalThis.window;
  try {
    return await importEnv();
  } finally {
    globalThis.window = originalWindow;
  }
};

describe('env', () => {
  beforeEach(() => {
    process.env['AUTH_SECRET'] = 'test-auth-secret';
    delete process.env['SKIP_ENV_VALIDATION'];
  });

  afterEach(() => {
    restoreEnv();
  });

  it('parses a valid RESEND_API_KEY and exposes it typed', async () => {
    process.env['RESEND_API_KEY'] = RESEND_KEY;

    const { env } = await importEnvOnServer();

    expect(env.RESEND_API_KEY).toBe(RESEND_KEY);
  });

  it('leaves RESEND_API_KEY undefined when absent (magic-link sign-in stays unavailable)', async () => {
    delete process.env['RESEND_API_KEY'];

    const { env } = await importEnvOnServer();

    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('accepts personal-data keys that are 32 bytes of base64', async () => {
    process.env['PERSONAL_DATA_ENCRYPTION_KEY'] = `v1:${MOCK_ENCRYPTION_KEY}`;
    process.env['PERSONAL_DATA_INDEX_KEY'] = MOCK_ENCRYPTION_KEY;

    const { env } = await importEnvOnServer();

    expect(env.PERSONAL_DATA_INDEX_KEY).toBe(MOCK_ENCRYPTION_KEY);
  });

  it('rejects a PERSONAL_DATA_INDEX_KEY shorter than 32 bytes', async () => {
    process.env['PERSONAL_DATA_INDEX_KEY'] = SHORT_KEY;

    await expect(importEnvOnServer()).rejects.toThrow();
  });

  it('rejects a PERSONAL_DATA_ENCRYPTION_KEY with a short key in an older version', async () => {
    process.env['PERSONAL_DATA_ENCRYPTION_KEY'] =
      `v2:${MOCK_ENCRYPTION_KEY},v1:${SHORT_KEY}`;

    await expect(importEnvOnServer()).rejects.toThrow();
  });

  it('skips validation entirely when SKIP_ENV_VALIDATION is set', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';
    delete process.env['RESEND_API_KEY'];

    await expect(importEnvOnServer()).resolves.toBeDefined();
  });

  it('parses a valid BLOB_READ_WRITE_TOKEN and exposes it typed', async () => {
    process.env['BLOB_READ_WRITE_TOKEN'] = 'vercel_blob_rw_store_token';

    const { env } = await importEnvOnServer();

    expect(env.BLOB_READ_WRITE_TOKEN).toBe('vercel_blob_rw_store_token');
  });

  it('leaves BLOB_READ_WRITE_TOKEN undefined when absent (uploads stay unavailable)', async () => {
    delete process.env['BLOB_READ_WRITE_TOKEN'];

    const { env } = await importEnvOnServer();

    expect(env.BLOB_READ_WRITE_TOKEN).toBeUndefined();
  });

  it('parses a valid WEB_APP_URL and exposes it typed', async () => {
    process.env['WEB_APP_URL'] = WEB_URL;

    const { env } = await importEnvOnServer();

    expect(env.WEB_APP_URL).toBe(WEB_URL);
  });

  it('leaves WEB_APP_URL undefined when absent (revalidation calls are skipped)', async () => {
    delete process.env['WEB_APP_URL'];

    const { env } = await importEnvOnServer();

    expect(env.WEB_APP_URL).toBeUndefined();
  });

  it('parses a valid SITE_CONFIG_REVALIDATE_SECRET and exposes it typed', async () => {
    process.env['SITE_CONFIG_REVALIDATE_SECRET'] = REVALIDATE_SECRET;

    const { env } = await importEnvOnServer();

    expect(env.SITE_CONFIG_REVALIDATE_SECRET).toBe(REVALIDATE_SECRET);
  });

  it('leaves SITE_CONFIG_REVALIDATE_SECRET undefined when absent (revalidation calls are skipped)', async () => {
    delete process.env['SITE_CONFIG_REVALIDATE_SECRET'];

    const { env } = await importEnvOnServer();

    expect(env.SITE_CONFIG_REVALIDATE_SECRET).toBeUndefined();
  });

  it('never throws at import time when WEB_APP_URL/SITE_CONFIG_REVALIDATE_SECRET are absent', async () => {
    delete process.env['WEB_APP_URL'];
    delete process.env['SITE_CONFIG_REVALIDATE_SECRET'];

    await expect(importEnvOnServer()).resolves.toBeDefined();
  });

  it('parses a valid TENANT_PROVISIONING_GITHUB_TOKEN and exposes it typed', async () => {
    process.env['TENANT_PROVISIONING_GITHUB_TOKEN'] = 'ghp_token';

    const { env } = await importEnvOnServer();

    expect(env.TENANT_PROVISIONING_GITHUB_TOKEN).toBe('ghp_token');
  });

  it('leaves TENANT_PROVISIONING_GITHUB_TOKEN undefined when absent (dispatch is skipped)', async () => {
    delete process.env['TENANT_PROVISIONING_GITHUB_TOKEN'];

    const { env } = await importEnvOnServer();

    expect(env.TENANT_PROVISIONING_GITHUB_TOKEN).toBeUndefined();
  });

  it('parses a valid TENANT_PROVISIONING_GITHUB_REPO and exposes it typed', async () => {
    process.env['TENANT_PROVISIONING_GITHUB_REPO'] = GITHUB_REPO;

    const { env } = await importEnvOnServer();

    expect(env.TENANT_PROVISIONING_GITHUB_REPO).toBe(GITHUB_REPO);
  });

  it('leaves TENANT_PROVISIONING_GITHUB_REPO undefined when absent (dispatch is skipped)', async () => {
    delete process.env['TENANT_PROVISIONING_GITHUB_REPO'];

    const { env } = await importEnvOnServer();

    expect(env.TENANT_PROVISIONING_GITHUB_REPO).toBeUndefined();
  });

  it('rejects a TENANT_PROVISIONING_GITHUB_REPO value with no slash', async () => {
    process.env['TENANT_PROVISIONING_GITHUB_REPO'] = 'acme-repo';

    await expect(importEnvOnServer()).rejects.toThrow();
  });

  it('parses a valid WORKER_ENQUEUE_URL and exposes it typed', async () => {
    process.env['WORKER_ENQUEUE_URL'] = WORKER_URL;

    const { env } = await importEnvOnServer();

    expect(env.WORKER_ENQUEUE_URL).toBe(WORKER_URL);
  });

  it('rejects a WORKER_ENQUEUE_URL that is not a URL', async () => {
    process.env['WORKER_ENQUEUE_URL'] = 'worker-dev';

    await expect(importEnvOnServer()).rejects.toThrow();
  });

  it('parses valid Vercel domain-check vars and exposes them typed', async () => {
    process.env['VERCEL_API_TOKEN'] = VERCEL_TOKEN;
    process.env['VERCEL_PROJECT_ID_WEB'] = VERCEL_PROJECT;
    process.env['VERCEL_TEAM_ID'] = VERCEL_TEAM;

    const { env } = await importEnvOnServer();

    expect(env.VERCEL_API_TOKEN).toBe(VERCEL_TOKEN);
    expect(env.VERCEL_PROJECT_ID_WEB).toBe(VERCEL_PROJECT);
    expect(env.VERCEL_TEAM_ID).toBe(VERCEL_TEAM);
  });

  it('leaves Vercel domain-check vars undefined when absent (the status page skips the live check)', async () => {
    delete process.env['VERCEL_API_TOKEN'];
    delete process.env['VERCEL_PROJECT_ID_WEB'];
    delete process.env['VERCEL_TEAM_ID'];

    const { env } = await importEnvOnServer();

    expect(env.VERCEL_API_TOKEN).toBeUndefined();
    expect(env.VERCEL_PROJECT_ID_WEB).toBeUndefined();
    expect(env.VERCEL_TEAM_ID).toBeUndefined();
  });
});
