import {
  MOCK_RESEND_PLATFORM_API_KEY,
  MOCK_RESEND_TENANT_API_KEY,
} from '@blog/email/testing/email-fixtures';

type TEnv = (typeof import('./env'))['env'];

const API_KEY_VARS = [
  ['RESEND_PLATFORM_API_KEY', MOCK_RESEND_PLATFORM_API_KEY],
  ['RESEND_TENANT_API_KEY', MOCK_RESEND_TENANT_API_KEY],
] as const;

async function importFreshEnv(): Promise<TEnv> {
  vi.resetModules();
  const freshModule = await import('./env');
  return freshModule.env;
}

describe('env', () => {
  beforeEach(() => {
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(API_KEY_VARS)('exposes a valid %s', async (name, value) => {
    vi.stubEnv(name, value);

    const freshEnv = await importFreshEnv();

    expect(freshEnv[name]).toBe(value);
  });

  describe.each(API_KEY_VARS)('%s', (name) => {
    it.each([
      ['an absent', undefined],
      ['an empty', ''],
    ])('is undefined for %s value', async (_label, value) => {
      vi.stubEnv(name, value);

      const freshEnv = await importFreshEnv();

      expect(freshEnv[name]).toBeUndefined();
    });
  });
});
