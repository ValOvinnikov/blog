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

  it.each([
    ['RESEND_API_KEY', RESEND_KEY],
    ['BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_store_token'],
    ['WEB_APP_URL', WEB_URL],
    ['SITE_CONFIG_REVALIDATE_SECRET', REVALIDATE_SECRET],
    ['TENANT_PROVISIONING_GITHUB_TOKEN', 'ghp_token'],
    ['TENANT_PROVISIONING_GITHUB_REPO', GITHUB_REPO],
    ['WORKER_ENQUEUE_URL', WORKER_URL],
    ['VERCEL_API_TOKEN', VERCEL_TOKEN],
    ['VERCEL_PROJECT_ID_WEB', VERCEL_PROJECT],
    ['VERCEL_TEAM_ID', VERCEL_TEAM],
  ] as const)('parses a valid %s and exposes it typed', async (key, value) => {
    process.env[key] = value;

    const { env } = await importEnvOnServer();

    expect(env[key]).toBe(value);
  });

  it.each([
    'RESEND_API_KEY',
    'BLOB_READ_WRITE_TOKEN',
    'WEB_APP_URL',
    'SITE_CONFIG_REVALIDATE_SECRET',
    'TENANT_PROVISIONING_GITHUB_TOKEN',
    'TENANT_PROVISIONING_GITHUB_REPO',
    'VERCEL_API_TOKEN',
    'VERCEL_PROJECT_ID_WEB',
    'VERCEL_TEAM_ID',
  ] as const)('leaves %s undefined when absent', async (key) => {
    delete process.env[key];

    const { env } = await importEnvOnServer();

    expect(env[key]).toBeUndefined();
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

  it('rejects a TENANT_PROVISIONING_GITHUB_REPO value with no slash', async () => {
    process.env['TENANT_PROVISIONING_GITHUB_REPO'] = 'acme-repo';

    await expect(importEnvOnServer()).rejects.toThrow();
  });

  it('rejects a WORKER_ENQUEUE_URL that is not a URL', async () => {
    process.env['WORKER_ENQUEUE_URL'] = 'worker-dev';

    await expect(importEnvOnServer()).rejects.toThrow();
  });
});
