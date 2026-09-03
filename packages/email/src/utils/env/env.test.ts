export {};

const ENV_KEYS = ['RESEND_API_KEY', 'SKIP_ENV_VALIDATION'] as const;

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

  it('exposes a valid RESEND_API_KEY', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['RESEND_API_KEY'] = 'test-resend-key';

    const { env } = await importEnv();

    expect(env.RESEND_API_KEY).toBe('test-resend-key');
  });

  it('leaves RESEND_API_KEY undefined when absent', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['RESEND_API_KEY'];

    const { env } = await importEnv();

    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('treats an empty RESEND_API_KEY as absent rather than throwing', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['RESEND_API_KEY'] = '';

    const { env } = await importEnv();

    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('skips validation entirely when SKIP_ENV_VALIDATION is set', async () => {
    process.env['SKIP_ENV_VALIDATION'] = 'true';
    delete process.env['RESEND_API_KEY'];

    await expect(importEnv()).resolves.toBeDefined();
  });
});
