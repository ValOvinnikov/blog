export {};

const ENV_KEYS = [
  'AUTH_SECRET',
  'MAGIC_LINK_FROM_ADDRESS',
  'AUTH_COOKIE_DOMAIN',
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

// `env.ts` validates eagerly on import (createEnv runs at module evaluation),
// so each case needs a fresh module instance via resetModules + dynamic import.
async function importEnv(): Promise<typeof import('./env')> {
  vi.resetModules();
  return import('./env');
}

describe('env', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('leaves every optional credential undefined when none are set', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
    process.env['AUTH_SECRET'] = 'test-secret';

    const { env } = await importEnv();

    expect(env.MAGIC_LINK_FROM_ADDRESS).toBeUndefined();
    expect(env.AUTH_COOKIE_DOMAIN).toBeUndefined();
  });

  describe('validation failure', () => {
    let consoleError: ReturnType<typeof vi.spyOn>;

    // createEnv logs `❌ Invalid environment variables: [...]` via console.error
    // right before throwing; suppress that expected output in these tests.
    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('throws naming AUTH_SECRET when it is missing and validation is not skipped', async () => {
      delete process.env['SKIP_ENV_VALIDATION'];
      for (const key of ENV_KEYS) {
        delete process.env[key];
      }

      await expect(importEnv()).rejects.toThrow();

      expect(consoleError).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ path: ['AUTH_SECRET'] }),
        ]),
      );
    });
  });

  it('exposes configured credentials by their exact env var names', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['AUTH_SECRET'] = 'test-secret';
    process.env['MAGIC_LINK_FROM_ADDRESS'] = 'Sign in <sign-in@example.com>';
    process.env['AUTH_COOKIE_DOMAIN'] = '.example.com';

    const { env } = await importEnv();

    expect(env.AUTH_SECRET).toBe('test-secret');
    expect(env.MAGIC_LINK_FROM_ADDRESS).toBe('Sign in <sign-in@example.com>');
    expect(env.AUTH_COOKIE_DOMAIN).toBe('.example.com');
  });

  it('skips validation when SKIP_ENV_VALIDATION is set', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';

    await expect(importEnv()).resolves.toBeDefined();
  });
});
