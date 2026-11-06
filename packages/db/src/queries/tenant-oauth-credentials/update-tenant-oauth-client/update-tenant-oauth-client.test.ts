import { OAUTH_PROVIDER } from '@blog/config/constants';
import { saveTenantOAuthCredentials } from '@blog/db/queries/tenant-oauth-credentials/save-tenant-oauth-credentials';
import * as schema from '@blog/db/schema';
import { tenantOAuthCredentials } from '@blog/db/schema/tenant-oauth-credentials';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_OTHER_TENANT_DOMAIN } from '@blog/db/testing/tenant-domains/fixtures';
import {
  MOCK_OAUTH_CREDENTIALS,
  MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
} from '@blog/db/testing/tenant-oauth-credentials/fixtures';
import {
  MOCK_TENANT_OAUTH_ENCRYPTION_KEY,
  useTenantOAuthEncryptionKey,
} from '@blog/db/testing/tenant-oauth-encryption-key';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';
import { decryptSecret } from '@blog/utils';

import { updateTenantOAuthClient } from './update-tenant-oauth-client';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useTenantOAuthEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(updateTenantOAuthClient, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('changes the client id and callback domain, keeping the stored secret', async () => {
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_OAUTH_CREDENTIALS,
      callbackDomain: MOCK_TENANT_DOMAIN,
    });

    const updated = await updateTenantOAuthClient(tenantId, {
      provider: OAUTH_PROVIDER.GOOGLE,
      clientId: MOCK_REPLACEMENT_OAUTH_CREDENTIALS.clientId,
      callbackDomain: MOCK_OTHER_TENANT_DOMAIN,
    });

    const [row] = await db().select().from(tenantOAuthCredentials);
    expect(updated).toBe(true);
    expect(row?.clientId).toBe(MOCK_REPLACEMENT_OAUTH_CREDENTIALS.clientId);
    expect(row?.callbackDomain).toBe(MOCK_OTHER_TENANT_DOMAIN);
    expect(
      decryptSecret(
        row?.clientSecretEncrypted ?? '',
        MOCK_TENANT_OAUTH_ENCRYPTION_KEY,
      ),
    ).toBe(MOCK_OAUTH_CREDENTIALS.clientSecret);
  });

  it('writes nothing and resolves false when the provider has no saved app', async () => {
    const updated = await updateTenantOAuthClient(tenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      clientId: MOCK_OAUTH_CREDENTIALS.clientId,
      callbackDomain: MOCK_TENANT_DOMAIN,
    });

    expect(updated).toBe(false);
    expect(await db().select().from(tenantOAuthCredentials)).toEqual([]);
  });

  it('rejects a blank client id', async () => {
    await expect(
      updateTenantOAuthClient(tenantId, {
        provider: OAUTH_PROVIDER.GITHUB,
        clientId: ' ',
        callbackDomain: MOCK_TENANT_DOMAIN,
      }),
    ).rejects.toThrow();
  });
});
