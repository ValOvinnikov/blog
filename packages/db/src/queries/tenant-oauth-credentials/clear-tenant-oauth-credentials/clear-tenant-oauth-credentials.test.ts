import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import { saveTenantOAuthCredentials } from '@shinefold/db/queries/tenant-oauth-credentials/save-tenant-oauth-credentials';
import * as schema from '@shinefold/db/schema';
import { tenantOAuthCredentials } from '@shinefold/db/schema/tenant-oauth-credentials';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_OAUTH_CREDENTIALS,
  MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
} from '@shinefold/db/testing/tenant-oauth-credentials/fixtures';
import { useTenantOAuthEncryptionKey } from '@shinefold/db/testing/tenant-oauth-encryption-key';

import { clearTenantOAuthCredentials } from './clear-tenant-oauth-credentials';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useTenantOAuthEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(clearTenantOAuthCredentials, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
    });
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
    });
  });

  it('removes only the named provider’s credentials', async () => {
    const isCleared = await clearTenantOAuthCredentials(
      tenantId,
      OAUTH_PROVIDER.GITHUB,
    );

    expect(isCleared).toBe(true);

    const rows = await db().select().from(tenantOAuthCredentials);
    expect(rows.map(({ provider }) => provider)).toEqual([
      OAUTH_PROVIDER.GOOGLE,
    ]);
  });

  it('leaves another tenant’s credentials for the same provider', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await saveTenantOAuthCredentials(otherTenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
    });

    await clearTenantOAuthCredentials(tenantId, OAUTH_PROVIDER.GITHUB);

    const rows = await db().select().from(tenantOAuthCredentials);
    expect(rows).toHaveLength(2);
  });

  it('resolves false when the provider has no saved credentials', async () => {
    await clearTenantOAuthCredentials(tenantId, OAUTH_PROVIDER.GITHUB);

    expect(
      await clearTenantOAuthCredentials(tenantId, OAUTH_PROVIDER.GITHUB),
    ).toBe(false);
  });
});
