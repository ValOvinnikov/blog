import { setTenantRevalidateWebhookSecret } from '@shinefold/db/queries/tenants/set-tenant-revalidate-webhook-secret';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_SANITY_PROJECT_ID } from '@shinefold/db/testing/sanity-management-client/fixtures';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  unsetTenantTokenEncryptionKey,
  useTenantTokenEncryptionKey,
} from '@shinefold/db/testing/tenant-token-encryption-key';
import {
  MOCK_REVALIDATE_WEBHOOK_SECRET,
  MOCK_UNKNOWN_SANITY_PROJECT_ID,
} from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getTenantRevalidateWebhookSecret } from './get-tenant-revalidate-webhook-secret';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { sanityProjectId: MOCK_SANITY_PROJECT_ID });

useTenantTokenEncryptionKey();

describe(getTenantRevalidateWebhookSecret, () => {
  describe('with a secret stored', () => {
    beforeEach(async () => {
      await setTenantRevalidateWebhookSecret(
        tenant().id,
        MOCK_REVALIDATE_WEBHOOK_SECRET,
      );
    });

    it('resolves the tenant id and the decrypted secret for its project id', async () => {
      const result = await getTenantRevalidateWebhookSecret(
        MOCK_SANITY_PROJECT_ID,
      );

      expect(result).toEqual({
        tenantId: tenant().id,
        secret: MOCK_REVALIDATE_WEBHOOK_SECRET,
      });
    });

    it('throws when the encryption key is not configured', async () => {
      unsetTenantTokenEncryptionKey();

      await expect(
        getTenantRevalidateWebhookSecret(MOCK_SANITY_PROJECT_ID),
      ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
    });
  });

  it('resolves the tenant id with no secret when none is stored', async () => {
    const result = await getTenantRevalidateWebhookSecret(
      MOCK_SANITY_PROJECT_ID,
    );

    expect(result).toEqual({ tenantId: tenant().id, secret: undefined });
  });

  it('resolves undefined for a project id no tenant owns', async () => {
    const result = await getTenantRevalidateWebhookSecret(
      MOCK_UNKNOWN_SANITY_PROJECT_ID,
    );

    expect(result).toBeUndefined();
  });
});
