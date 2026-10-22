import { setTenantRevalidateWebhookSecret } from '@blog/db/queries/tenants/set-tenant-revalidate-webhook-secret';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { SANITY_PROJECT_ID } from '@blog/db/testing/sanity-management-client/fixtures';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import { REVALIDATE_WEBHOOK_SECRET } from '@blog/db/testing/tenants/fixtures';

import { getTenantRevalidateWebhookSecret } from './get-tenant-revalidate-webhook-secret';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

useTenantTokenEncryptionKey();

afterEach(async () => {
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
      await setTenantRevalidateWebhookSecret(
        tenant.id,
        REVALIDATE_WEBHOOK_SECRET,
      );
    });

    it('resolves the tenant id and the decrypted secret for its project id', async () => {
      await expect(
        getTenantRevalidateWebhookSecret(SANITY_PROJECT_ID),
      ).resolves.toEqual({
        tenantId: tenant.id,
        secret: REVALIDATE_WEBHOOK_SECRET,
      });
    });

    it('throws when the encryption key is not configured', async () => {
      vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

      await expect(
        getTenantRevalidateWebhookSecret(SANITY_PROJECT_ID),
      ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
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
