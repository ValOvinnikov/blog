import { MOCK_DATABASE_URL } from '@blog/db/testing/env/fixtures';

async function importEnv(): Promise<typeof import('./env')> {
  vi.resetModules();
  return import('./env');
}

describe('env', () => {
  beforeEach(() => {
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
  });

  it('parses a valid environment and exposes the pooled connection string', async () => {
    vi.stubEnv('DATABASE_URL', MOCK_DATABASE_URL);

    const { env } = await importEnv();

    expect(env.DATABASE_URL).toBe(MOCK_DATABASE_URL);
  });

  describe('invalid environment', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws when DATABASE_URL is missing', async () => {
      vi.stubEnv('DATABASE_URL', undefined);

      await expect(importEnv()).rejects.toThrow();
    });

    it('throws when DATABASE_URL is empty', async () => {
      vi.stubEnv('DATABASE_URL', '');

      await expect(importEnv()).rejects.toThrow();
    });
  });

  it('skips validation when SKIP_ENV_VALIDATION is set', async () => {
    vi.stubEnv('SKIP_ENV_VALIDATION', 'true');
    vi.stubEnv('DATABASE_URL', undefined);

    const { env } = await importEnv();

    expect(env.DATABASE_URL).toBeUndefined();
  });
});
