import { faker } from '@faker-js/faker';

faker.seed(6016);

const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_DATASET = faker.lorem.word();
const MOCK_OTHER_DATASET = faker.lorem.word();
const MOCK_READ_TOKEN = faker.string.alphanumeric(32);
const MOCK_WRITE_TOKEN = faker.string.alphanumeric(32);

async function importEnv(): Promise<typeof import('./env')> {
  vi.resetModules();
  return import('./env');
}

describe('env', () => {
  beforeEach(() => {
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', MOCK_PROJECT_ID);
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', MOCK_DATASET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['SANITY_API_READ_TOKEN', 'SANITY_API_WRITE_TOKEN'] as const)(
    'leaves %s undefined when absent',
    async (key) => {
      vi.stubEnv(key, undefined);

      const { env } = await importEnv();

      expect(env[key]).toBeUndefined();
    },
  );

  describe('validation failures', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws when NEXT_PUBLIC_SANITY_PROJECT_ID is missing', async () => {
      vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', undefined);

      await expect(importEnv()).rejects.toThrow();
    });

    it('throws when NEXT_PUBLIC_SANITY_DATASET is empty', async () => {
      vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '');

      await expect(importEnv()).rejects.toThrow();
    });
  });

  describe('with both tokens set', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', MOCK_OTHER_DATASET);
      vi.stubEnv('SANITY_API_READ_TOKEN', MOCK_READ_TOKEN);
      vi.stubEnv('SANITY_API_WRITE_TOKEN', MOCK_WRITE_TOKEN);
    });

    it('exposes the parsed environment', async () => {
      const { env } = await importEnv();

      expect(env.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe(MOCK_PROJECT_ID);
      expect(env.NEXT_PUBLIC_SANITY_DATASET).toBe(MOCK_OTHER_DATASET);
      expect(env.SANITY_API_READ_TOKEN).toBe(MOCK_READ_TOKEN);
      expect(env.SANITY_API_WRITE_TOKEN).toBe(MOCK_WRITE_TOKEN);
    });

    describe('in the browser', () => {
      beforeEach(() => {
        vi.stubGlobal('window', {});
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('reads the public project id and dataset', async () => {
        const { env } = await importEnv();

        expect(env.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe(MOCK_PROJECT_ID);
        expect(env.NEXT_PUBLIC_SANITY_DATASET).toBe(MOCK_OTHER_DATASET);
      });

      it('throws when a server-only token is read', async () => {
        const { env } = await importEnv();

        expect(() => env.SANITY_API_READ_TOKEN).toThrow(
          /server-side environment variable/,
        );
      });
    });
  });
});
