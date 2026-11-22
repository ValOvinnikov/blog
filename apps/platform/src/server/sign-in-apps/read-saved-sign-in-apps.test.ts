import {
  MOCK_REPLACEMENT_CLIENT_ID,
  mockOAuthClient,
} from '@platform/testing/sign-in-apps/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';

import { readSavedSignInApps } from './read-saved-sign-in-apps';

vi.mock('@shinefold/db', async () => {
  const { mockSignInAppsDb } =
    await import('@platform/testing/sign-in-apps/fixtures');
  return mockSignInAppsDb();
});

const { listTenantOAuthClients } = queries.tenantOAuthCredentials;

describe(readSavedSignInApps, () => {
  it('reads each saved app by its provider', async () => {
    const google = mockOAuthClient();
    const github = mockOAuthClient({
      provider: OAUTH_PROVIDER.GITHUB,
      clientId: MOCK_REPLACEMENT_CLIENT_ID,
    });
    vi.mocked(listTenantOAuthClients).mockResolvedValueOnce([github, google]);

    const savedApps = await readSavedSignInApps(MOCK_TENANT_ID);

    expect(listTenantOAuthClients).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(savedApps.get(OAUTH_PROVIDER.GOOGLE)).toBe(google);
    expect(savedApps.get(OAUTH_PROVIDER.GITHUB)).toBe(github);
  });

  it('has no provider for a site that saved none', async () => {
    vi.mocked(listTenantOAuthClients).mockResolvedValueOnce([]);

    const savedApps = await readSavedSignInApps(MOCK_TENANT_ID);

    expect(savedApps.has(OAUTH_PROVIDER.GOOGLE)).toBe(false);
  });
});
