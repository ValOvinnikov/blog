import { OAUTH_PROVIDER } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { tenantOAuthCredentials } from '@blog/db/schema/tenant-oauth-credentials';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_OAUTH_CREDENTIALS,
  MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
} from '@blog/db/testing/tenant-oauth-credentials/fixtures';
import {
  MISSING_TENANT_OAUTH_KEY_ERROR,
  MOCK_TENANT_OAUTH_ENCRYPTION_KEY,
  useTenantOAuthEncryptionKey,
} from '@blog/db/testing/tenant-oauth-encryption-key';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { decryptSecret } from '@blog/utils';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';

import { saveTenantOAuthCredentials } from './save-tenant-oauth-credentials';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useTenantOAuthEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(saveTenantOAuthCredentials, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('stores the client secret encrypted, never in plain text', async () => {
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_OAUTH_CREDENTIALS,
    });

    const [row] = await db().select().from(tenantOAuthCredentials);

    expect(row?.clientId).toBe(MOCK_OAUTH_CREDENTIALS.clientId);
    expect(row?.clientSecretEncrypted).not.toContain(
      MOCK_OAUTH_CREDENTIALS.clientSecret,
    );
    expect(
      decryptSecret(
        row?.clientSecretEncrypted ?? '',
        MOCK_TENANT_OAUTH_ENCRYPTION_KEY,
      ),
    ).toBe(MOCK_OAUTH_CREDENTIALS.clientSecret);
  });

  it('stores a secret the tenant-token key cannot decrypt', async () => {
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_OAUTH_CREDENTIALS,
    });

    const [row] = await db().select().from(tenantOAuthCredentials);

    expect(() =>
      decryptSecret(row?.clientSecretEncrypted ?? '', MOCK_ENCRYPTION_KEY),
    ).toThrow();
  });

  it('replaces a provider’s credentials, leaving one row for it', async () => {
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
    });

    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
    });

    const rows = await db().select().from(tenantOAuthCredentials);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.clientId).toBe(MOCK_REPLACEMENT_OAUTH_CREDENTIALS.clientId);
    expect(
      decryptSecret(
        rows[0]?.clientSecretEncrypted ?? '',
        MOCK_TENANT_OAUTH_ENCRYPTION_KEY,
      ),
    ).toBe(MOCK_REPLACEMENT_OAUTH_CREDENTIALS.clientSecret);
  });

  it('keeps each provider’s credentials independent', async () => {
    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GITHUB,
      ...MOCK_OAUTH_CREDENTIALS,
    });

    await saveTenantOAuthCredentials(tenantId, {
      provider: OAUTH_PROVIDER.GOOGLE,
      ...MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
    });

    const rows = await db().select().from(tenantOAuthCredentials);
    expect(rows).toHaveLength(2);
  });

  it('rejects a blank client secret', async () => {
    await expect(
      saveTenantOAuthCredentials(tenantId, {
        provider: OAUTH_PROVIDER.GOOGLE,
        clientId: MOCK_OAUTH_CREDENTIALS.clientId,
        clientSecret: ' ',
      }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      saveTenantOAuthCredentials(MOCK_MISSING_TENANT_ID, {
        provider: OAUTH_PROVIDER.GOOGLE,
        ...MOCK_OAUTH_CREDENTIALS,
      }),
    ).rejects.toThrow();
  });

  it('throws when the encryption key is not configured', async () => {
    vi.stubEnv('TENANT_OAUTH_ENCRYPTION_KEY', undefined);

    await expect(
      saveTenantOAuthCredentials(tenantId, {
        provider: OAUTH_PROVIDER.GOOGLE,
        ...MOCK_OAUTH_CREDENTIALS,
      }),
    ).rejects.toThrow(MISSING_TENANT_OAUTH_KEY_ERROR);
  });
});
