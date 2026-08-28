import { loadRecheckEnv } from './env';

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  originalEnv['SANITY_MANAGEMENT_TOKEN'] =
    process.env['SANITY_MANAGEMENT_TOKEN'];
  process.env['SANITY_MANAGEMENT_TOKEN'] = 'sanity-token';
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
  it('resolves the Sanity management token', () => {
    const env = loadRecheckEnv();

    expect(env).toEqual({ sanityManagementToken: 'sanity-token' });
  });

  it('throws when SANITY_MANAGEMENT_TOKEN is missing', () => {
    delete process.env['SANITY_MANAGEMENT_TOKEN'];

    expect(() => loadRecheckEnv()).toThrow(
      'recheck-tenant-owners: missing required env var SANITY_MANAGEMENT_TOKEN.',
    );
  });
});
