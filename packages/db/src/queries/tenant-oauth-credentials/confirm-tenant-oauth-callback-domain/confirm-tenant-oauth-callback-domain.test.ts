import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import { saveTenantOAuthCredentials } from '@shinefold/db/queries/tenant-oauth-credentials/save-tenant-oauth-credentials';
import { tenantOAuthCredentials } from '@shinefold/db/schema/tenant-oauth-credentials';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_OTHER_TENANT_DOMAIN } from '@shinefold/db/testing/tenant-domains/fixtures';
import { MOCK_OAUTH_CREDENTIALS } from '@shinefold/db/testing/tenant-oauth-credentials/fixtures';
import { useTenantOAuthEncryptionKey } from '@shinefold/db/testing/tenant-oauth-encryption-key';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { confirmTenantOAuthCallbackDomain } from './confirm-tenant-oauth-callback-domain';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useTenantOAuthEncryptionKey();

describe(confirmTenantOAuthCallbackDomain, () => {
  beforeEach(async () => {
    await saveTenantOAuthCredentials(tenant().id, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_OAUTH_CREDENTIALS,
      callbackDomain: MOCK_TENANT_DOMAIN,
    });
    await saveTenantOAuthCredentials(tenant().id, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
      callbackDomain: MOCK_TENANT_DOMAIN,
    });
  });

  it('records the new callback domain for that provider only', async () => {
    await confirmTenantOAuthCallbackDomain(
      tenant().id,
      OAUTH_PROVIDER.GOOGLE,
      MOCK_OTHER_TENANT_DOMAIN,
    );

    const rows = await db()
      .select({
        provider: tenantOAuthCredentials.provider,
        callbackDomain: tenantOAuthCredentials.callbackDomain,
      })
      .from(tenantOAuthCredentials);
    expect(rows).toEqual(
      expect.arrayContaining([
        {
          provider: OAUTH_PROVIDER.GOOGLE,
          callbackDomain: MOCK_OTHER_TENANT_DOMAIN,
        },
        { provider: OAUTH_PROVIDER.GITHUB, callbackDomain: MOCK_TENANT_DOMAIN },
      ]),
    );
  });
});
