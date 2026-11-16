import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import { saveTenantOAuthCredentials } from '@shinefold/db/queries/tenant-oauth-credentials/save-tenant-oauth-credentials';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_OAUTH_CREDENTIALS,
  MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
} from '@shinefold/db/testing/tenant-oauth-credentials/fixtures';
import { useTenantOAuthEncryptionKey } from '@shinefold/db/testing/tenant-oauth-encryption-key';

import { getTenantOAuthCredentials } from './get-tenant-oauth-credentials';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useTenantOAuthEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantOAuthCredentials, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns no credentials for a tenant that saved none', async () => {
    expect(await getTenantOAuthCredentials(tenantId)).toEqual({});
  });

  it('returns each saved provider’s decrypted credentials', async () => {
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
    });
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
    });

    expect(await getTenantOAuthCredentials(tenantId)).toEqual({
      [OAUTH_PROVIDER.GITHUB]: MOCK_OAUTH_CREDENTIALS,
      [OAUTH_PROVIDER.GOOGLE]: MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
    });
  });

  it('never returns another tenant’s credentials', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await saveTenantOAuthCredentials(otherTenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
    });

    expect(await getTenantOAuthCredentials(tenantId)).toEqual({});
  });
});
