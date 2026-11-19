import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  unsetTenantTokenEncryptionKey,
  useTenantTokenEncryptionKey,
} from '@shinefold/db/testing/tenant-token-encryption-key';
import { MOCK_TENANT_READ_TOKEN } from '@shinefold/db/testing/tenants/fixtures';
import {
  readTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';
import { decryptSecret } from '@shinefold/utils';
import { MOCK_ENCRYPTION_KEY } from '@shinefold/utils/encryption/encryption-fixtures';

import { setTenantSanityToken } from './set-tenant-sanity-token';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useTenantTokenEncryptionKey();

describe(setTenantSanityToken, () => {
  it('stores the token encrypted, not as plaintext', async () => {
    await setTenantSanityToken(tenant().id, MOCK_TENANT_READ_TOKEN);

    const row = await readTestTenant(db(), tenant().id);

    expect(row.sanityReadTokenEncrypted).not.toContain(MOCK_TENANT_READ_TOKEN);
    expect(
      decryptSecret(row.sanityReadTokenEncrypted ?? '', MOCK_ENCRYPTION_KEY),
    ).toBe(MOCK_TENANT_READ_TOKEN);
  });

  it('throws when the encryption key is not configured', async () => {
    unsetTenantTokenEncryptionKey();

    await expect(
      setTenantSanityToken(tenant().id, MOCK_TENANT_READ_TOKEN),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
  });
});
