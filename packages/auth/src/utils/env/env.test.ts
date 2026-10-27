import { MOCK_FROM_ADDRESS } from '@blog/auth/testing/magic-link-fixtures';
import { MOCK_AUTH_SECRET } from '@blog/auth/testing/session-fixtures';

const AUTH_SECRET_KEY = 'AUTH_SECRET';

async function importEnv(): Promise<typeof import('./env')> {
  vi.resetModules();
  return import('./env');
}

describe('env', () => {
  beforeEach(() => {
    vi.stubEnv(AUTH_SECRET_KEY, undefined);
    vi.stubEnv('MAGIC_LINK_FROM_ADDRESS', undefined);
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('with AUTH_SECRET set', () => {
    beforeEach(() => {
      vi.stubEnv(AUTH_SECRET_KEY, MOCK_AUTH_SECRET);
    });

    it('leaves the from address undefined when it is not set', async () => {
      const { env } = await importEnv();

      expect(env.MAGIC_LINK_FROM_ADDRESS).toBeUndefined();
    });

    it('exposes configured values by their exact env var names', async () => {
      vi.stubEnv('MAGIC_LINK_FROM_ADDRESS', MOCK_FROM_ADDRESS);

      const { env } = await importEnv();

      expect(env.AUTH_SECRET).toBe(MOCK_AUTH_SECRET);
      expect(env.MAGIC_LINK_FROM_ADDRESS).toBe(MOCK_FROM_ADDRESS);
    });
  });

  describe('without AUTH_SECRET', () => {
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('throws, reporting AUTH_SECRET as the missing variable', async () => {
      await expect(importEnv()).rejects.toThrow();

      const [, issues] = consoleError.mock.calls[0] ?? [];
      const issuePaths = (issues as { path: string[] }[]).map(
        ({ path }) => path,
      );
      expect(issuePaths).toContainEqual([AUTH_SECRET_KEY]);
    });

    it('skips validation when SKIP_ENV_VALIDATION is set', async () => {
      vi.stubEnv('SKIP_ENV_VALIDATION', 'true');
      vi.stubEnv('MAGIC_LINK_FROM_ADDRESS', MOCK_FROM_ADDRESS);

      const { env } = await importEnv();

      expect(env.AUTH_SECRET).toBeUndefined();
      expect(env.MAGIC_LINK_FROM_ADDRESS).toBe(MOCK_FROM_ADDRESS);
    });
  });
});
