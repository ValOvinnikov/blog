import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import { MOCK_REVALIDATE_WEBHOOK_SECRET } from '@blog/db/testing/tenants/fixtures';
import { decryptSecret } from '@blog/utils';
import { TEST_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantRevalidateWebhookSecret } from './set-tenant-revalidate-webhook-secret';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

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
        TEST_ENCRYPTION_KEY,
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

    expect(row?.revalidateWebhookSecretEncrypted).toBeNull();
  });

  it('throws when the encryption key is not configured', async () => {
    vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

    await expect(
      setTenantRevalidateWebhookSecret(
        tenant.id,
        MOCK_REVALIDATE_WEBHOOK_SECRET,
      ),
    ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
  });
});
