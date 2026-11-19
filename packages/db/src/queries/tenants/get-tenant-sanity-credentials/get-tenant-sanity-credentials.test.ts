import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@shinefold/db/constants';
import { archiveTenant } from '@shinefold/db/queries/tenants/archive-tenant';
import { setTenantProvisioningStatus } from '@shinefold/db/queries/tenants/set-tenant-provisioning-status';
import { setTenantSanityToken } from '@shinefold/db/queries/tenants/set-tenant-sanity-token';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  unsetTenantTokenEncryptionKey,
  useTenantTokenEncryptionKey,
} from '@shinefold/db/testing/tenant-token-encryption-key';
import {
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_READ_TOKEN,
  MOCK_TENANT_VALUES,
} from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getTenantSanityCredentials } from './get-tenant-sanity-credentials';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useTenantTokenEncryptionKey();
useFrozenClock();
const tenant = useTestTenant(db, {
  ...MOCK_TENANT_VALUES,
  status: TENANT_STATUS.ACTIVE,
});

const { sanityProjectId, sanityDataset } = MOCK_TENANT_VALUES;

describe(getTenantSanityCredentials, () => {
  describe('with a token set', () => {
    beforeEach(async () => {
      await setTenantSanityToken(tenant().id, MOCK_TENANT_READ_TOKEN);
    });

    it('resolves the decrypted token, project, dataset and state for an active tenant', async () => {
      const credentials = await getTenantSanityCredentials(tenant().id);

      expect(credentials).toEqual({
        projectId: sanityProjectId,
        dataset: sanityDataset,
        token: MOCK_TENANT_READ_TOKEN,
        defaultLocale: LOCALE_ISO_CODES.EN,
        status: TENANT_STATUS.ACTIVE,
        deprovisionedAt: null,
        provisioningStatus: null,
      });
    });

    it('still resolves credentials for an archived tenant, with its deprovisionedAt', async () => {
      await archiveTenant(tenant().id);

      const credentials = await getTenantSanityCredentials(tenant().id);

      expect(credentials).toEqual({
        projectId: sanityProjectId,
        dataset: sanityDataset,
        token: MOCK_TENANT_READ_TOKEN,
        defaultLocale: LOCALE_ISO_CODES.EN,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: MOCK_NOW,
        provisioningStatus: null,
      });
    });

    it('throws when the encryption key is not configured', async () => {
      unsetTenantTokenEncryptionKey();

      await expect(getTenantSanityCredentials(tenant().id)).rejects.toThrow(
        MISSING_TENANT_TOKEN_KEY_ERROR,
      );
    });
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PROVISIONING,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])(
    'resolves undefined for a %s tenant with no token set yet',
    async (status) => {
      await setTenantProvisioningStatus(tenant().id, status);

      const credentials = await getTenantSanityCredentials(tenant().id);

      expect(credentials).toBeUndefined();
    },
  );

  it('resolves undefined when the tenant has no token set yet', async () => {
    const credentials = await getTenantSanityCredentials(tenant().id);

    expect(credentials).toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    const credentials = await getTenantSanityCredentials(
      MOCK_MISSING_TENANT_ID,
    );

    expect(credentials).toBeUndefined();
  });
});
