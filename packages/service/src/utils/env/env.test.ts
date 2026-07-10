import { afterEach, describe, expect, it, vi } from 'vitest';

const ENV_KEYS = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_API_READ_TOKEN',
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

  it('parses a valid environment and exposes typed values', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'staging';
    process.env['SANITY_API_READ_TOKEN'] = 'secret-token';

    const { env } = await importEnv();

    expect(env.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('abc123');
    expect(env.NEXT_PUBLIC_SANITY_DATASET).toBe('staging');
    expect(env.SANITY_API_READ_TOKEN).toBe('secret-token');
  });

  it('throws when NEXT_PUBLIC_SANITY_PROJECT_ID is missing', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';

    await expect(importEnv()).rejects.toThrow();
  });

  it('throws when NEXT_PUBLIC_SANITY_DATASET is empty (no default)', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = '';

    await expect(importEnv()).rejects.toThrow();
  });

  it('leaves SANITY_API_READ_TOKEN undefined when absent', async () => {
    delete process.env['SKIP_ENV_VALIDATION'];
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'abc123';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'production';
    delete process.env['SANITY_API_READ_TOKEN'];

    const { env } = await importEnv();

    expect(env.SANITY_API_READ_TOKEN).toBeUndefined();
  });
});
