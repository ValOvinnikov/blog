/**
 * @vitest-environment jsdom
 */
export {};

const ENV_KEYS = [
  'SANITY_REVALIDATE_SECRET',
  'ANTHROPIC_API_KEY',
  'SANITY_GENERATE_SECRET',
  'WEB_ANALYTICS_ENABLED',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SKIP_ENV_VALIDATION',
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
  // @ts-expect-error simulate server
  delete globalThis.window;
  try {
    return await importEnv();
  } finally {
    globalThis.window = originalWindow;
  }
};

describe('env', () => {
  beforeEach(() => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';
  });

  afterEach(() => {
    restoreEnv();
  });

  it('leaves SANITY_REVALIDATE_SECRET undefined when absent', async () => {
    delete process.env['SANITY_REVALIDATE_SECRET'];

    const { env } = await importEnvOnServer();

    expect(env.SANITY_REVALIDATE_SECRET).toBeUndefined();
  });

  it('leaves ANTHROPIC_API_KEY and SANITY_GENERATE_SECRET undefined when absent (the skim pipeline stays disabled)', async () => {
    delete process.env['ANTHROPIC_API_KEY'];
    delete process.env['SANITY_GENERATE_SECRET'];

    const { env } = await importEnvOnServer();

    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.SANITY_GENERATE_SECRET).toBeUndefined();
  });

  it('leaves WEB_ANALYTICS_ENABLED undefined when absent (Analytics/SpeedInsights stay omitted)', async () => {
    delete process.env['WEB_ANALYTICS_ENABLED'];

    const { env } = await importEnvOnServer();

    expect(env.WEB_ANALYTICS_ENABLED).toBeUndefined();
  });

  it('parses WEB_ANALYTICS_ENABLED when set to "true"', async () => {
    process.env['WEB_ANALYTICS_ENABLED'] = 'true';

    const { env } = await importEnvOnServer();

    expect(env.WEB_ANALYTICS_ENABLED).toBe('true');
  });

  it('leaves NEXT_PUBLIC_SITE_URL undefined when absent', async () => {
    delete process.env['NEXT_PUBLIC_SITE_URL'];

    const { env } = await importEnv();

    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });

  describe('with SANITY_REVALIDATE_SECRET set', () => {
    beforeEach(() => {
      process.env['SANITY_REVALIDATE_SECRET'] = 'revalidate-secret';
    });

    it('parses a valid environment and exposes typed values', async () => {
      process.env['ANTHROPIC_API_KEY'] = 'anthropic-key';
      process.env['SANITY_GENERATE_SECRET'] = 'generate-secret';
      process.env['NEXT_PUBLIC_SITE_URL'] = 'https://example.com';
      process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'staging';
      process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'staging';

      const { env } = await importEnvOnServer();

      expect(env.SANITY_REVALIDATE_SECRET).toBe('revalidate-secret');
      expect(env.ANTHROPIC_API_KEY).toBe('anthropic-key');
      expect(env.SANITY_GENERATE_SECRET).toBe('generate-secret');
      expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://example.com');
      expect(env.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('abc123');
      expect(env.NEXT_PUBLIC_SANITY_DATASET).toBe('staging');
    });

    it('throws when SANITY_REVALIDATE_SECRET is read on the client', async () => {
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

    it('throws when WEB_ANALYTICS_ENABLED is set to an unrecognized value', async () => {
      process.env['WEB_ANALYTICS_ENABLED'] = 'yes';

      await expect(importEnvOnServer()).rejects.toThrow();
    });

    it('throws when NEXT_PUBLIC_SITE_URL is not a valid URL', async () => {
      process.env['NEXT_PUBLIC_SITE_URL'] = 'not-a-url';

      await expect(importEnv()).rejects.toThrow();
    });

    it('throws when NEXT_PUBLIC_SANITY_PROJECT_ID is missing', async () => {
      delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];

      await expect(importEnv()).rejects.toThrow();
    });

    it('throws when NEXT_PUBLIC_SANITY_DATASET is empty (no default)', async () => {
      process.env['NEXT_PUBLIC_SANITY_DATASET'] = '';

      await expect(importEnv()).rejects.toThrow();
    });
  });
});
