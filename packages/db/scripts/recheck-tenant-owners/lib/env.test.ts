import { MOCK_SANITY_MANAGEMENT_TOKEN } from '@blog/db/testing/recheck-tenant-owners/fixtures';

import { loadRecheckEnv } from './env';

beforeEach(() => {
  vi.stubEnv('SANITY_MANAGEMENT_TOKEN', MOCK_SANITY_MANAGEMENT_TOKEN);
});

describe(loadRecheckEnv, () => {
  it('resolves the Sanity management token', () => {
    const env = loadRecheckEnv();

    expect(env).toEqual({
      sanityManagementToken: MOCK_SANITY_MANAGEMENT_TOKEN,
    });
  });

  it('throws when SANITY_MANAGEMENT_TOKEN is missing', () => {
    vi.stubEnv('SANITY_MANAGEMENT_TOKEN', undefined);

    expect(() => loadRecheckEnv()).toThrow(
      'recheck-tenant-owners: missing required env var SANITY_MANAGEMENT_TOKEN.',
    );
  });
});
