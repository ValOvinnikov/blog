import { KEY_ENCODING } from '@blog/utils/encryption';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import {
  MOCK_WEB_APP_URL,
  MOCK_REVALIDATE_SECRET,
} from '@platform/testing/env/fixtures';

const RESEND_KEY = 'resend-key';
const GITHUB_REPO = 'acme-org/acme-repo';
const WORKER_URL = 'https://worker-dev.example.com';
const BLOB_TOKEN = 'vercel_blob_rw_store_token';
const GITHUB_TOKEN = 'ghp_token';
const VERCEL_TOKEN = 'vercel-token';
const VERCEL_PROJECT = 'prj_123';
const VERCEL_TEAM = 'team_123';
const SHORT_KEY = Buffer.alloc(16).toString(KEY_ENCODING);

const OPTIONAL_VALID_VALUE = {
  RESEND_API_KEY: RESEND_KEY,
  BLOB_READ_WRITE_TOKEN: BLOB_TOKEN,
  WEB_APP_URL: MOCK_WEB_APP_URL,
  SITE_CONFIG_REVALIDATE_SECRET: MOCK_REVALIDATE_SECRET,
  TENANT_PROVISIONING_GITHUB_TOKEN: GITHUB_TOKEN,
  TENANT_PROVISIONING_GITHUB_REPO: GITHUB_REPO,
  VERCEL_API_TOKEN: VERCEL_TOKEN,
  VERCEL_PROJECT_ID_WEB: VERCEL_PROJECT,
  VERCEL_TEAM_ID: VERCEL_TEAM,
} as const;

const VALID_VALUE = {
  ...OPTIONAL_VALID_VALUE,
  WORKER_ENQUEUE_URL: WORKER_URL,
} as const;

const INVALID_VALUE = {
  PERSONAL_DATA_INDEX_KEY: SHORT_KEY,
  PERSONAL_DATA_ENCRYPTION_KEY: `v2:${MOCK_ENCRYPTION_KEY},v1:${SHORT_KEY}`,
  TENANT_PROVISIONING_GITHUB_REPO: 'acme-repo',
  WORKER_ENQUEUE_URL: 'worker-dev',
} as const;

const ENV_KEYS = [
  ...new Set([
    ...Object.keys(VALID_VALUE),
    ...Object.keys(INVALID_VALUE),
    'SKIP_ENV_VALIDATION',
    'AUTH_SECRET',
  ]),
];

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

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

  it.each(Object.entries(VALID_VALUE) as [keyof typeof VALID_VALUE, string][])(
    'parses a valid %s and exposes it typed',
    async (key, value) => {
      process.env[key] = value;

      const { env } = await importEnvOnServer();

      expect(env[key]).toBe(value);
    },
  );

  it.each(
    Object.keys(OPTIONAL_VALID_VALUE) as (keyof typeof OPTIONAL_VALID_VALUE)[],
  )('leaves an absent %s undefined without throwing', async (key) => {
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

  it.each(Object.entries(INVALID_VALUE))(
    'rejects an invalid %s',
    async (key, value) => {
      process.env[key] = value;

      await expect(importEnvOnServer()).rejects.toThrow();
    },
  );

  it('skips validation entirely when SKIP_ENV_VALIDATION is set', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';
    delete process.env['RESEND_API_KEY'];

    await expect(importEnvOnServer()).resolves.toBeDefined();
  });
});
