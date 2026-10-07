export {};

const ENV_KEYS = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_API_READ_TOKEN',
  'SANITY_API_WRITE_TOKEN',
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

async function importEnv(): Promise<typeof import('./env')> {
  vi.resetModules();
  return import('./env');
}

describe('env', () => {
  beforeEach(() => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';
  });

  afterEach(() => {
    restoreEnv();
  });

  it('leaves SANITY_API_READ_TOKEN undefined when absent', async () => {
    delete process.env['SANITY_API_READ_TOKEN'];

    const { env } = await importEnv();

    expect(env.SANITY_API_READ_TOKEN).toBeUndefined();
  });

  it('leaves SANITY_API_WRITE_TOKEN undefined when absent', async () => {
    delete process.env['SANITY_API_WRITE_TOKEN'];

    const { env } = await importEnv();

    expect(env.SANITY_API_WRITE_TOKEN).toBeUndefined();
  });

  describe('validation failures', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
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

  describe('with a staging dataset and both tokens', () => {
    beforeEach(() => {
      process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'staging';
      process.env['SANITY_API_READ_TOKEN'] = 'secret-token';
      process.env['SANITY_API_WRITE_TOKEN'] = 'secret-write-token';
    });

    it('parses a valid environment and exposes typed values', async () => {
      const { env } = await importEnv();

      expect(env.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('abc123');
      expect(env.NEXT_PUBLIC_SANITY_DATASET).toBe('staging');
      expect(env.SANITY_API_READ_TOKEN).toBe('secret-token');
      expect(env.SANITY_API_WRITE_TOKEN).toBe('secret-write-token');
    });

    describe('as if window is defined', () => {
      beforeEach(() => {
        vi.stubGlobal('window', {});
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('reads NEXT_PUBLIC_SANITY_PROJECT_ID/DATASET', async () => {
        const { env } = await importEnv();

        expect(env.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('abc123');
        expect(env.NEXT_PUBLIC_SANITY_DATASET).toBe('staging');
      });

      it('throws when SANITY_API_READ_TOKEN is accessed', async () => {
        const { env } = await importEnv();

        expect(() => env.SANITY_API_READ_TOKEN).toThrow(
          /server-side environment variable/,
        );
      });
    });
  });
});
