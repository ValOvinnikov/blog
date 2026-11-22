import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  tenantOAuthCredentials,
  type TTenantOAuthCredentials,
} from '@shinefold/db/schema/tenant-oauth-credentials';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_OAUTH_CREDENTIALS,
  MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
} from '@shinefold/db/testing/tenant-oauth-credentials/fixtures';
import {
  MISSING_TENANT_OAUTH_KEY_ERROR,
  MOCK_TENANT_OAUTH_ENCRYPTION_KEY,
  useTenantOAuthEncryptionKey,
} from '@shinefold/db/testing/tenant-oauth-encryption-key';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { decryptSecret } from '@shinefold/utils';
import { MOCK_ENCRYPTION_KEY } from '@shinefold/utils/encryption/encryption-fixtures';

import { saveTenantOAuthCredentials } from './save-tenant-oauth-credentials';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useTenantOAuthEncryptionKey();

describe(saveTenantOAuthCredentials, () => {
  describe('with Google credentials saved', () => {
    let row: TMaybeUndefined<TTenantOAuthCredentials>;

    beforeEach(async () => {
      await saveTenantOAuthCredentials(tenant().id, {
        provider: OAUTH_PROVIDER.GOOGLE,
        ...MOCK_OAUTH_CREDENTIALS,
      });
      [row] = await db().select().from(tenantOAuthCredentials);
    });

    it('stores the client secret encrypted, never in plain text', () => {
      expect(row?.clientId).toBe(MOCK_OAUTH_CREDENTIALS.clientId);
      expect(row?.clientSecretEncrypted).not.toContain(
        MOCK_OAUTH_CREDENTIALS.clientSecret,
      );
      expect(
        decryptSecret(
          row?.clientSecretEncrypted ?? '',
          MOCK_TENANT_OAUTH_ENCRYPTION_KEY,
        ),
      ).toBe(MOCK_OAUTH_CREDENTIALS.clientSecret);
    });

    it('stores a secret the tenant-token key cannot decrypt', () => {
      expect(() =>
        decryptSecret(row?.clientSecretEncrypted ?? '', MOCK_ENCRYPTION_KEY),
      ).toThrow();
    });
  });

  describe('with GitHub credentials saved', () => {
    beforeEach(async () => {
      await saveTenantOAuthCredentials(tenant().id, {
        provider: OAUTH_PROVIDER.GITHUB,
        ...MOCK_OAUTH_CREDENTIALS,
      });
    });

    it('replaces a provider’s credentials, leaving one row for it', async () => {
      await saveTenantOAuthCredentials(tenant().id, {
        provider: OAUTH_PROVIDER.GITHUB,
        ...MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
      });

      const rows = await db().select().from(tenantOAuthCredentials);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.clientId).toBe(
        MOCK_REPLACEMENT_OAUTH_CREDENTIALS.clientId,
      );
      expect(
        decryptSecret(
          rows[0]?.clientSecretEncrypted ?? '',
          MOCK_TENANT_OAUTH_ENCRYPTION_KEY,
        ),
      ).toBe(MOCK_REPLACEMENT_OAUTH_CREDENTIALS.clientSecret);
    });

    it('keeps each provider’s credentials independent', async () => {
      await saveTenantOAuthCredentials(tenant().id, {
        provider: OAUTH_PROVIDER.GOOGLE,
        ...MOCK_REPLACEMENT_OAUTH_CREDENTIALS,
      });

      const rows = await db().select().from(tenantOAuthCredentials);
      expect(rows).toHaveLength(2);
    });
  });

  it('rejects a blank client secret', async () => {
    await expect(
      saveTenantOAuthCredentials(tenant().id, {
        provider: OAUTH_PROVIDER.GOOGLE,
        clientId: MOCK_OAUTH_CREDENTIALS.clientId,
        clientSecret: ' ',
      }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      saveTenantOAuthCredentials(MOCK_MISSING_TENANT_ID, {
        provider: OAUTH_PROVIDER.GOOGLE,
        ...MOCK_OAUTH_CREDENTIALS,
      }),
    ).rejects.toThrow();
  });

  it('throws when the encryption key is not configured', async () => {
    vi.stubEnv('TENANT_OAUTH_ENCRYPTION_KEY', undefined);

    await expect(
      saveTenantOAuthCredentials(tenant().id, {
        provider: OAUTH_PROVIDER.GOOGLE,
        ...MOCK_OAUTH_CREDENTIALS,
      }),
    ).rejects.toThrow(MISSING_TENANT_OAUTH_KEY_ERROR);
  });
});
