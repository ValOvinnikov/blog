import { MOCK_RESEND_API_KEY } from '@blog/email/testing/email-fixtures';

type TEnv = (typeof import('./env'))['env'];

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

  it('exposes a valid RESEND_API_KEY', async () => {
    vi.stubEnv('RESEND_API_KEY', MOCK_RESEND_API_KEY);

    const freshEnv = await importFreshEnv();

    expect(freshEnv.RESEND_API_KEY).toBe(MOCK_RESEND_API_KEY);
  });

  it.each([
    ['an absent', undefined],
    ['an empty', ''],
  ])('leaves RESEND_API_KEY undefined for %s value', async (_name, value) => {
    vi.stubEnv('RESEND_API_KEY', value);

    const freshEnv = await importFreshEnv();

    expect(freshEnv.RESEND_API_KEY).toBeUndefined();
  });
});
