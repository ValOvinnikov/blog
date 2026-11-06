import { OAUTH_PROVIDER } from '@blog/config/constants';
import { saveTenantOAuthCredentials } from '@blog/db/queries/tenant-oauth-credentials/save-tenant-oauth-credentials';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_OAUTH_CREDENTIALS,
  MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
} from '@blog/db/testing/tenant-oauth-credentials/fixtures';
import { useTenantOAuthEncryptionKey } from '@blog/db/testing/tenant-oauth-encryption-key';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';

import { listTenantOAuthClients } from './list-tenant-oauth-clients';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useTenantOAuthEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantOAuthClients, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('lists each saved provider’s client id and callback domain without its secret', async () => {
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
    });
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
      callbackDomain: MOCK_TENANT_DOMAIN,
    });

    const clients = await listTenantOAuthClients(tenantId);

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
    expect(await listTenantOAuthClients(tenantId)).toEqual([]);
  });
});
