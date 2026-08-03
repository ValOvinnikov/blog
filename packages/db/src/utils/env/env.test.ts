export {};

const ENV_KEYS = ['DATABASE_URL', 'SKIP_ENV_VALIDATION'] as const;

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

  it('parses a valid environment and exposes the typed pooled connection string', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['DATABASE_URL'] = 'postgresql://user:pass@host/db';

    const { env } = await importEnv();

    expect(env.DATABASE_URL).toBe('postgresql://user:pass@host/db');
  });

  it('throws when DATABASE_URL is missing', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['DATABASE_URL'];

    await expect(importEnv()).rejects.toThrow();
  });

  it('throws when DATABASE_URL is empty (no default)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['DATABASE_URL'] = '';

    await expect(importEnv()).rejects.toThrow();
  });

  it('skips validation when SKIP_ENV_VALIDATION is set, even with DATABASE_URL missing', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';
    delete process.env['DATABASE_URL'];

    const { env } = await importEnv();

    expect(env.DATABASE_URL).toBeUndefined();
  });
});
