import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import {
  MOCK_SEEDED_AT,
  MOCK_TENANT_WRITE_TOKEN,
} from '@blog/db/testing/tenants/fixtures';
import { decryptSecret } from '@blog/utils';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantSanityWriteTokenAndSeededAt } from './set-tenant-sanity-write-token-and-seeded-at';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useTenantTokenEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSanityWriteTokenAndSeededAt, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db());
  });

  it('stores the token encrypted and the seeded-at timestamp in one call', async () => {
    await setTenantSanityWriteTokenAndSeededAt(
      tenant.id,
      MOCK_TENANT_WRITE_TOKEN,
      MOCK_SEEDED_AT,
    );

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
    expect(row?.seededAt).toEqual(MOCK_SEEDED_AT);
  });

  it('throws without a configured encryption key, leaving both columns untouched', async () => {
    vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

    await expect(
      setTenantSanityWriteTokenAndSeededAt(
        tenant.id,
        MOCK_TENANT_WRITE_TOKEN,
        MOCK_SEEDED_AT,
      ),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row).toEqual(tenant);
  });
});
