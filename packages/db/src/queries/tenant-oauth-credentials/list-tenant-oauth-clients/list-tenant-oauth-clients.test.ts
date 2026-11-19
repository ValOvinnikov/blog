import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import { saveTenantOAuthCredentials } from '@shinefold/db/queries/tenant-oauth-credentials/save-tenant-oauth-credentials';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_OAUTH_CREDENTIALS,
  MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
} from '@shinefold/db/testing/tenant-oauth-credentials/fixtures';
import { useTenantOAuthEncryptionKey } from '@shinefold/db/testing/tenant-oauth-encryption-key';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { listTenantOAuthClients } from './list-tenant-oauth-clients';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useTenantOAuthEncryptionKey();

describe(listTenantOAuthClients, () => {
  it('lists each saved provider’s client id and callback domain without its secret', async () => {
    await saveTenantOAuthCredentials(tenant().id, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
    });
    await saveTenantOAuthCredentials(tenant().id, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
      callbackDomain: MOCK_TENANT_DOMAIN,
    });

    const clients = await listTenantOAuthClients(tenant().id);

    expect(clients).toEqual([
      {
        provider: OAUTH_PROVIDER.GITHUB,
        clientId: MOCK_OAUTH_CREDENTIALS.clientId,
        callbackDomain: MOCK_TENANT_DOMAIN,
        updatedAt: expect.any(Date),
      },
      {
        provider: OAUTH_PROVIDER.GOOGLE,
        clientId: MOCK_REPLACEMENT_OAUTH_CREDENTIALS.clientId,
        callbackDomain: null,
        updatedAt: expect.any(Date),
      },
    ]);
  });

  it('returns an empty list for a tenant that saved none', async () => {
    expect(await listTenantOAuthClients(tenant().id)).toEqual([]);
  });
});
