import * as schema from '@shinefold/db/schema';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  unsetTenantTokenEncryptionKey,
  useTenantTokenEncryptionKey,
} from '@shinefold/db/testing/tenant-token-encryption-key';
import { MOCK_REVALIDATE_WEBHOOK_SECRET } from '@shinefold/db/testing/tenants/fixtures';
import { decryptSecret } from '@shinefold/utils';
import { MOCK_ENCRYPTION_KEY } from '@shinefold/utils/encryption/encryption-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantRevalidateWebhookSecret } from './set-tenant-revalidate-webhook-secret';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

useTenantTokenEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantRevalidateWebhookSecret, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db());
  });

  it('stores the secret encrypted, not as plaintext', async () => {
    await setTenantRevalidateWebhookSecret(
      tenant.id,
      MOCK_REVALIDATE_WEBHOOK_SECRET,
    );

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(
      decryptSecret(
        row?.revalidateWebhookSecretEncrypted ?? '',
        MOCK_ENCRYPTION_KEY,
      ),
    ).toBe(MOCK_REVALIDATE_WEBHOOK_SECRET);
    expect(row?.revalidateWebhookSecretEncrypted).not.toContain(
      MOCK_REVALIDATE_WEBHOOK_SECRET,
    );
  });

  it('leaves other tenants untouched', async () => {
    const other = await insertTestTenant(db());

    await setTenantRevalidateWebhookSecret(
      tenant.id,
      MOCK_REVALIDATE_WEBHOOK_SECRET,
    );

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, other.id));

    expect(row).toEqual(other);
  });

  it('throws when the encryption key is not configured', async () => {
    unsetTenantTokenEncryptionKey();

    await expect(
      setTenantRevalidateWebhookSecret(
        tenant.id,
        MOCK_REVALIDATE_WEBHOOK_SECRET,
      ),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
  });
});
