import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { TEST_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantRevalidateWebhookSecret } from './set-tenant-revalidate-webhook-secret';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const WEBHOOK_SECRET = 'whsec-tenant-secret-value';

const db = useQueryTestDb(getDbMock);

beforeEach(() => {
  vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', TEST_ENCRYPTION_KEY);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await db().delete(schema.tenants);
});

describe(setTenantRevalidateWebhookSecret, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db());
  });

  it('stores the secret encrypted, not as plaintext', async () => {
    await setTenantRevalidateWebhookSecret(tenant.id, WEBHOOK_SECRET);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.revalidateWebhookSecretEncrypted).toEqual(expect.any(String));
    expect(row?.revalidateWebhookSecretEncrypted).not.toContain(WEBHOOK_SECRET);
  });

  it('leaves other tenants untouched', async () => {
    const other = await insertTestTenant(db());

    await setTenantRevalidateWebhookSecret(tenant.id, WEBHOOK_SECRET);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, other.id));

    expect(row?.revalidateWebhookSecretEncrypted).toBeNull();
  });

  it('throws when the encryption key is not configured', async () => {
    vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

    await expect(
      setTenantRevalidateWebhookSecret(tenant.id, WEBHOOK_SECRET),
    ).rejects.toThrow('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  });
});
