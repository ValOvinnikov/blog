import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  unsetTenantTokenEncryptionKey,
  useTenantTokenEncryptionKey,
} from '@shinefold/db/testing/tenant-token-encryption-key';
import {
  MOCK_TENANT_MANAGEMENT_ROBOT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
} from '@shinefold/db/testing/tenants/fixtures';
import {
  readTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';
import { decryptSecret } from '@shinefold/utils';
import { MOCK_ENCRYPTION_KEY } from '@shinefold/utils/encryption/encryption-fixtures';

import { setTenantSanityManagementToken } from './set-tenant-sanity-management-token';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useTenantTokenEncryptionKey();

const MOCK_MINTED = {
  token: MOCK_TENANT_MANAGEMENT_TOKEN,
  robotId: MOCK_TENANT_MANAGEMENT_ROBOT_ID,
};

describe(setTenantSanityManagementToken, () => {
  it('stores the token encrypted, not as plaintext, beside its robot id', async () => {
    await setTenantSanityManagementToken(tenant().id, MOCK_MINTED);

    const row = await readTestTenant(db(), tenant().id);

    expect(row.sanityManagementTokenEncrypted).not.toContain(
      MOCK_TENANT_MANAGEMENT_TOKEN,
    );
    expect(
      decryptSecret(
        row.sanityManagementTokenEncrypted ?? '',
        MOCK_ENCRYPTION_KEY,
      ),
    ).toBe(MOCK_TENANT_MANAGEMENT_TOKEN);
    expect(row.sanityManagementRobotId).toBe(MOCK_TENANT_MANAGEMENT_ROBOT_ID);
  });

  it('throws without a configured encryption key, leaving the row untouched', async () => {
    unsetTenantTokenEncryptionKey();

    await expect(
      setTenantSanityManagementToken(tenant().id, MOCK_MINTED),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);

    const row = await readTestTenant(db(), tenant().id);

    expect(row).toEqual(tenant());
  });
});
