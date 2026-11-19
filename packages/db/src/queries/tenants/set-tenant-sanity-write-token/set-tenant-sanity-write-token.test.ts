import * as schema from '@shinefold/db/schema';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  unsetTenantTokenEncryptionKey,
  useTenantTokenEncryptionKey,
} from '@shinefold/db/testing/tenant-token-encryption-key';
import { MOCK_TENANT_WRITE_TOKEN } from '@shinefold/db/testing/tenants/fixtures';
import { decryptSecret } from '@shinefold/utils';
import { MOCK_ENCRYPTION_KEY } from '@shinefold/utils/encryption/encryption-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantSanityWriteToken } from './set-tenant-sanity-write-token';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useTenantTokenEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSanityWriteToken, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db());
  });

  it('stores the token encrypted, not as plaintext', async () => {
    await setTenantSanityWriteToken(tenant.id, MOCK_TENANT_WRITE_TOKEN);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityWriteTokenEncrypted).not.toContain(
      MOCK_TENANT_WRITE_TOKEN,
    );
    expect(
      decryptSecret(row?.sanityWriteTokenEncrypted ?? '', MOCK_ENCRYPTION_KEY),
    ).toBe(MOCK_TENANT_WRITE_TOKEN);
  });

  it('throws when the encryption key is not configured', async () => {
    unsetTenantTokenEncryptionKey();

    await expect(
      setTenantSanityWriteToken(tenant.id, MOCK_TENANT_WRITE_TOKEN),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
  });
});
