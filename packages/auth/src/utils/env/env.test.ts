import { MOCK_AUTH_SECRET } from '@blog/auth/testing/session-fixtures';

const FROM_ADDRESS = 'Sign in <sign-in@example.com>';

export {};

const ENV_KEYS = [
  'AUTH_SECRET',
  'MAGIC_LINK_FROM_ADDRESS',
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
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    restoreEnv();
  });

  describe('with AUTH_SECRET set', () => {
    beforeEach(() => {
      process.env['AUTH_SECRET'] = MOCK_AUTH_SECRET;
    });

    it('leaves every optional credential undefined when none are set', async () => {
      const { env } = await importEnv();

      expect(env.MAGIC_LINK_FROM_ADDRESS).toBeUndefined();
    });

    it('exposes configured credentials by their exact env var names', async () => {
      process.env['MAGIC_LINK_FROM_ADDRESS'] = FROM_ADDRESS;

      const { env } = await importEnv();

      expect(env.AUTH_SECRET).toBe(MOCK_AUTH_SECRET);
      expect(env.MAGIC_LINK_FROM_ADDRESS).toBe(FROM_ADDRESS);
    });
  });

  describe('validation failure', () => {
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('throws naming AUTH_SECRET when it is missing and validation is not skipped', async () => {
      await expect(importEnv()).rejects.toThrow();

      const [, issues] = consoleError.mock.calls[0] ?? [];
      const issuePaths = (issues as { path: string[] }[]).map(
        ({ path }) => path,
      );
      expect(issuePaths).toContainEqual([ENV_KEYS[0]]);
    });
  });

  it('skips validation when SKIP_ENV_VALIDATION is set', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';

    await expect(importEnv()).resolves.toBeDefined();
  });
});
