export {};

const ENV_KEYS = [
  'AUTH_SECRET',
  'AUTH_GITHUB_ID',
  'AUTH_GITHUB_SECRET',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
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

    expect(env.AUTH_GITHUB_ID).toBeUndefined();
    expect(env.AUTH_GITHUB_SECRET).toBeUndefined();
    expect(env.AUTH_GOOGLE_ID).toBeUndefined();
    expect(env.AUTH_GOOGLE_SECRET).toBeUndefined();
    expect(env.MAGIC_LINK_FROM_ADDRESS).toBeUndefined();
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
    process.env['AUTH_GITHUB_ID'] = 'github-id';
    process.env['AUTH_GITHUB_SECRET'] = 'github-secret';
    process.env['AUTH_GOOGLE_ID'] = 'google-id';
    process.env['AUTH_GOOGLE_SECRET'] = 'google-secret';
    process.env['MAGIC_LINK_FROM_ADDRESS'] = 'Sign in <sign-in@example.com>';

    const { env } = await importEnv();

    expect(env.AUTH_SECRET).toBe('test-secret');
    expect(env.AUTH_GITHUB_ID).toBe('github-id');
    expect(env.AUTH_GITHUB_SECRET).toBe('github-secret');
    expect(env.AUTH_GOOGLE_ID).toBe('google-id');
    expect(env.AUTH_GOOGLE_SECRET).toBe('google-secret');
    expect(env.MAGIC_LINK_FROM_ADDRESS).toBe('Sign in <sign-in@example.com>');
  });

  it('skips validation when SKIP_ENV_VALIDATION is set', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';

    await expect(importEnv()).resolves.toBeDefined();
  });
});
