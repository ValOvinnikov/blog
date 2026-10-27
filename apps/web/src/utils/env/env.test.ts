/**
 * @vitest-environment jsdom
 */
import type { TMaybeUndefined } from '@blog/config';
import { KEY_ENCODING } from '@blog/utils/encryption';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import { faker } from '@faker-js/faker';

faker.seed(111);

const MOCK_REVALIDATE_SECRET = faker.string.alphanumeric(16);
const MOCK_ANTHROPIC_KEY = faker.string.alphanumeric(16);
const MOCK_GENERATE_SECRET = faker.string.alphanumeric(16);
const MOCK_SITE_URL = faker.internet.url();
const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const [MOCK_DATASET, MOCK_STAGING_DATASET] = faker.helpers.uniqueArray(
  faker.lorem.word,
  2,
);
const MOCK_INVALID_FLAG = faker.lorem.word();
const MOCK_INVALID_URL = faker.lorem.word();
const SHORT_KEY = Buffer.alloc(16).toString(KEY_ENCODING);

const ENV_KEYS = [
  'SANITY_REVALIDATE_SECRET',
  'ANTHROPIC_API_KEY',
  'SANITY_GENERATE_SECRET',
  'WEB_ANALYTICS_ENABLED',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SKIP_ENV_VALIDATION',
  'PERSONAL_DATA_ENCRYPTION_KEY',
  'PERSONAL_DATA_INDEX_KEY',
] as const;

type TEnvKey = (typeof ENV_KEYS)[number];

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<TEnvKey, TMaybeUndefined<string>>;

const setEnv = (key: TEnvKey, value: TMaybeUndefined<string>): void => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

const restoreEnv = (): void => {
  for (const key of ENV_KEYS) {
    setEnv(key, originalEnv[key]);
  }
};

const importEnv = async (): Promise<typeof import('./env')> => {
  vi.resetModules();
  return import('./env');
};

const importEnvOnServer = async (): Promise<typeof import('./env')> => {
  const originalWindow = globalThis.window;
  // @ts-expect-error -- window is non-optional, but a server has none
  delete globalThis.window;
  try {
    return await importEnv();
  } finally {
    globalThis.window = originalWindow;
  }
};

describe('env', () => {
  beforeEach(() => {
    setEnv('SKIP_ENV_VALIDATION', undefined);
    setEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', MOCK_PROJECT_ID);
    setEnv('NEXT_PUBLIC_SANITY_DATASET', MOCK_DATASET);
  });

  afterEach(() => {
    restoreEnv();
  });

  it.each([
    'SANITY_REVALIDATE_SECRET',
    'ANTHROPIC_API_KEY',
    'SANITY_GENERATE_SECRET',
    'WEB_ANALYTICS_ENABLED',
  ] as const)('leaves %s undefined when absent', async (key) => {
    setEnv(key, undefined);

    const { env } = await importEnvOnServer();

    expect(env[key]).toBeUndefined();
  });

  it('leaves NEXT_PUBLIC_SITE_URL undefined when absent', async () => {
    setEnv('NEXT_PUBLIC_SITE_URL', undefined);

    const { env } = await importEnv();

    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });

  it('parses WEB_ANALYTICS_ENABLED when set to "true"', async () => {
    setEnv('WEB_ANALYTICS_ENABLED', 'true');

    const { env } = await importEnvOnServer();

    expect(env.WEB_ANALYTICS_ENABLED).toBe('true');
  });

  it('accepts personal-data keys that are 32 bytes of base64', async () => {
    setEnv('PERSONAL_DATA_ENCRYPTION_KEY', `v1:${MOCK_ENCRYPTION_KEY}`);
    setEnv('PERSONAL_DATA_INDEX_KEY', MOCK_ENCRYPTION_KEY);

    const { env } = await importEnvOnServer();

    expect(env.PERSONAL_DATA_ENCRYPTION_KEY).toBe(`v1:${MOCK_ENCRYPTION_KEY}`);
    expect(env.PERSONAL_DATA_INDEX_KEY).toBe(MOCK_ENCRYPTION_KEY);
  });

  describe('with SANITY_REVALIDATE_SECRET set', () => {
    beforeEach(() => {
      setEnv('SANITY_REVALIDATE_SECRET', MOCK_REVALIDATE_SECRET);
    });

    it('exposes the parsed environment as typed values', async () => {
      setEnv('ANTHROPIC_API_KEY', MOCK_ANTHROPIC_KEY);
      setEnv('SANITY_GENERATE_SECRET', MOCK_GENERATE_SECRET);
      setEnv('NEXT_PUBLIC_SITE_URL', MOCK_SITE_URL);
      setEnv('NEXT_PUBLIC_SANITY_DATASET', MOCK_STAGING_DATASET);

      const { env } = await importEnvOnServer();

      expect(env.SANITY_REVALIDATE_SECRET).toBe(MOCK_REVALIDATE_SECRET);
      expect(env.ANTHROPIC_API_KEY).toBe(MOCK_ANTHROPIC_KEY);
      expect(env.SANITY_GENERATE_SECRET).toBe(MOCK_GENERATE_SECRET);
      expect(env.NEXT_PUBLIC_SITE_URL).toBe(MOCK_SITE_URL);
      expect(env.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe(MOCK_PROJECT_ID);
      expect(env.NEXT_PUBLIC_SANITY_DATASET).toBe(MOCK_STAGING_DATASET);
    });

    it('throws when a server secret is read on the client', async () => {
      const { env } = await importEnv();

      expect(() => env.SANITY_REVALIDATE_SECRET).toThrow();
    });
  });

  describe('validation failure', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([
      {
        case: 'a PERSONAL_DATA_INDEX_KEY shorter than 32 bytes',
        key: 'PERSONAL_DATA_INDEX_KEY' as const,
        value: SHORT_KEY,
        load: importEnvOnServer,
      },
      {
        case: 'a short PERSONAL_DATA_ENCRYPTION_KEY in an older version',
        key: 'PERSONAL_DATA_ENCRYPTION_KEY' as const,
        value: `v2:${MOCK_ENCRYPTION_KEY},v1:${SHORT_KEY}`,
        load: importEnvOnServer,
      },
      {
        case: 'an unrecognized WEB_ANALYTICS_ENABLED value',
        key: 'WEB_ANALYTICS_ENABLED' as const,
        value: MOCK_INVALID_FLAG,
        load: importEnvOnServer,
      },
      {
        case: 'a NEXT_PUBLIC_SITE_URL that is not a URL',
        key: 'NEXT_PUBLIC_SITE_URL' as const,
        value: MOCK_INVALID_URL,
        load: importEnv,
      },
      {
        case: 'a missing NEXT_PUBLIC_SANITY_PROJECT_ID',
        key: 'NEXT_PUBLIC_SANITY_PROJECT_ID' as const,
        value: undefined,
        load: importEnv,
      },
      {
        case: 'an empty NEXT_PUBLIC_SANITY_DATASET',
        key: 'NEXT_PUBLIC_SANITY_DATASET' as const,
        value: '',
        load: importEnv,
      },
    ])('rejects $case', async ({ key, value, load }) => {
      setEnv(key, value);

      await expect(load()).rejects.toThrow();
    });
  });
});
