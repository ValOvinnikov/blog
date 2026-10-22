import { setTenantRevalidateWebhookSecret } from '@blog/db/queries/tenants/set-tenant-revalidate-webhook-secret';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { TEST_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';

import { getTenantRevalidateWebhookSecret } from './get-tenant-revalidate-webhook-secret';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const SANITY_PROJECT_ID = 'abc123';
const WEBHOOK_SECRET = 'whsec-tenant-secret-value';

const db = useQueryTestDb(getDbMock);

beforeEach(() => {
  vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', TEST_ENCRYPTION_KEY);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await db().delete(schema.tenants);
});

describe(getTenantRevalidateWebhookSecret, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db(), {
      sanityProjectId: SANITY_PROJECT_ID,
    });
  });

  describe('with a secret stored', () => {
    beforeEach(async () => {
      await setTenantRevalidateWebhookSecret(tenant.id, WEBHOOK_SECRET);
    });

    it('resolves the tenant id and the decrypted secret for its project id', async () => {
      await expect(
        getTenantRevalidateWebhookSecret(SANITY_PROJECT_ID),
      ).resolves.toEqual({ tenantId: tenant.id, secret: WEBHOOK_SECRET });
    });

    it('throws when the encryption key is not configured', async () => {
      vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

      await expect(
        getTenantRevalidateWebhookSecret(SANITY_PROJECT_ID),
      ).rejects.toThrow('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
    });
  });

  it('resolves the tenant id with no secret when none is stored', async () => {
    await expect(
      getTenantRevalidateWebhookSecret(SANITY_PROJECT_ID),
    ).resolves.toEqual({ tenantId: tenant.id, secret: undefined });
  });

  it('resolves undefined for a project id no tenant owns', async () => {
    await expect(
      getTenantRevalidateWebhookSecret('unknown-project'),
    ).resolves.toBeUndefined();
  });
});
