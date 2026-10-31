import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import {
  MOCK_TENANT_MANAGEMENT_ROBOT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
} from '@blog/db/testing/tenants/fixtures';
import { decryptSecret } from '@blog/utils';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantSanityManagementToken } from './set-tenant-sanity-management-token';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useTenantTokenEncryptionKey();

const MOCK_MINTED = {
  token: MOCK_TENANT_MANAGEMENT_TOKEN,
  robotId: MOCK_TENANT_MANAGEMENT_ROBOT_ID,
};

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSanityManagementToken, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db());
  });

  it('stores the token encrypted, not as plaintext, beside its robot id', async () => {
    await setTenantSanityManagementToken(tenant.id, MOCK_MINTED);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityManagementTokenEncrypted).not.toContain(
      MOCK_TENANT_MANAGEMENT_TOKEN,
    );
    expect(
      decryptSecret(
        row?.sanityManagementTokenEncrypted ?? '',
        MOCK_ENCRYPTION_KEY,
      ),
    ).toBe(MOCK_TENANT_MANAGEMENT_TOKEN);
    expect(row?.sanityManagementRobotId).toBe(MOCK_TENANT_MANAGEMENT_ROBOT_ID);
  });

  it('throws without a configured encryption key, leaving the row untouched', async () => {
    vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

    await expect(
      setTenantSanityManagementToken(tenant.id, MOCK_MINTED),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row).toEqual(tenant);
  });
});
