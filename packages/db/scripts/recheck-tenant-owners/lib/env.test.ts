import { loadRecheckEnv } from './env';

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  originalEnv['SANITY_MANAGEMENT_TOKEN'] =
    process.env['SANITY_MANAGEMENT_TOKEN'];
  originalEnv['RESEND_API_KEY'] = process.env['RESEND_API_KEY'];
  process.env['SANITY_MANAGEMENT_TOKEN'] = 'sanity-token';
  delete process.env['RESEND_API_KEY'];
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe(loadRecheckEnv, () => {
  it('resolves the Sanity management token, leaving resendApiKey undefined when unset', () => {
    const env = loadRecheckEnv();

    expect(env).toEqual({
      sanityManagementToken: 'sanity-token',
      resendApiKey: undefined,
    });
  });

  it('resolves resendApiKey when RESEND_API_KEY is set', () => {
    process.env['RESEND_API_KEY'] = 'resend-key';

    const env = loadRecheckEnv();

    expect(env).toEqual({
      sanityManagementToken: 'sanity-token',
      resendApiKey: 'resend-key',
    });
  });

  it('throws when SANITY_MANAGEMENT_TOKEN is missing', () => {
    delete process.env['SANITY_MANAGEMENT_TOKEN'];

    expect(() => loadRecheckEnv()).toThrow(
      'recheck-tenant-owners: missing required env var SANITY_MANAGEMENT_TOKEN.',
    );
  });
});
