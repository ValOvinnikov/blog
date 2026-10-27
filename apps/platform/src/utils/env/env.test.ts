import { KEY_ENCODING } from '@blog/utils/encryption';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import { faker } from '@faker-js/faker';
import {
  MOCK_WEB_APP_URL,
  MOCK_REVALIDATE_SECRET,
} from '@platform/testing/env/fixtures';

faker.seed(1);

const MOCK_RESEND_KEY = faker.string.alphanumeric(24);
const MOCK_GITHUB_REPO = `${faker.lorem.word()}/${faker.lorem.word()}`;
const MOCK_WORKER_URL = faker.internet.url();
const MOCK_BLOB_TOKEN = faker.string.alphanumeric(24);
const MOCK_GITHUB_TOKEN = faker.string.alphanumeric(24);
const MOCK_VERCEL_TOKEN = faker.string.alphanumeric(24);
const MOCK_VERCEL_PROJECT = faker.string.alphanumeric(12);
const MOCK_VERCEL_TEAM = faker.string.alphanumeric(12);
const MOCK_AUTH_SECRET = faker.string.alphanumeric(24);
const MOCK_INVALID_GITHUB_REPO = faker.lorem.word();
const MOCK_INVALID_URL = faker.lorem.word();
const SHORT_KEY = Buffer.alloc(16).toString(KEY_ENCODING);

const OPTIONAL_VALID_VALUE = {
  RESEND_API_KEY: MOCK_RESEND_KEY,
  BLOB_READ_WRITE_TOKEN: MOCK_BLOB_TOKEN,
  WEB_APP_URL: MOCK_WEB_APP_URL,
  SITE_CONFIG_REVALIDATE_SECRET: MOCK_REVALIDATE_SECRET,
  TENANT_PROVISIONING_GITHUB_TOKEN: MOCK_GITHUB_TOKEN,
  TENANT_PROVISIONING_GITHUB_REPO: MOCK_GITHUB_REPO,
  VERCEL_API_TOKEN: MOCK_VERCEL_TOKEN,
  VERCEL_PROJECT_ID_WEB: MOCK_VERCEL_PROJECT,
  VERCEL_TEAM_ID: MOCK_VERCEL_TEAM,
} as const;

const VALID_VALUE = {
  ...OPTIONAL_VALID_VALUE,
  WORKER_ENQUEUE_URL: MOCK_WORKER_URL,
} as const;

const INVALID_VALUE = {
  PERSONAL_DATA_INDEX_KEY: SHORT_KEY,
  PERSONAL_DATA_ENCRYPTION_KEY: `v2:${MOCK_ENCRYPTION_KEY},v1:${SHORT_KEY}`,
  TENANT_PROVISIONING_GITHUB_REPO: MOCK_INVALID_GITHUB_REPO,
  WORKER_ENQUEUE_URL: MOCK_INVALID_URL,
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
    process.env['AUTH_SECRET'] = MOCK_AUTH_SECRET;
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

  describe('validation failure', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each(Object.entries(INVALID_VALUE))(
      'rejects an invalid %s',
      async (key, value) => {
        process.env[key] = value;

        await expect(importEnvOnServer()).rejects.toThrow();
      },
    );
  });

  it('skips validation entirely when SKIP_ENV_VALIDATION is set', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';
    delete process.env['RESEND_API_KEY'];

    await expect(importEnvOnServer()).resolves.toBeDefined();
  });
});
