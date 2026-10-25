import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import { MOCK_TENANT_READ_TOKEN } from '@blog/db/testing/tenants/fixtures';
import { decryptSecret } from '@blog/utils';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantSanityToken } from './set-tenant-sanity-token';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useTenantTokenEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSanityToken, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db());
  });

  it('stores the token encrypted, not as plaintext', async () => {
    await setTenantSanityToken(tenant.id, MOCK_TENANT_READ_TOKEN);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityReadTokenEncrypted).not.toContain(MOCK_TENANT_READ_TOKEN);
    expect(
      decryptSecret(row?.sanityReadTokenEncrypted ?? '', MOCK_ENCRYPTION_KEY),
    ).toBe(MOCK_TENANT_READ_TOKEN);
  });

  it('throws when the encryption key is not configured', async () => {
    vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

    await expect(
      setTenantSanityToken(tenant.id, MOCK_TENANT_READ_TOKEN),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
  });
});
