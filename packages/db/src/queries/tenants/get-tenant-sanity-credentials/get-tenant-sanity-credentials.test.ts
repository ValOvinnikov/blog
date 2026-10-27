import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import { archiveTenant } from '@blog/db/queries/tenants/archive-tenant';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import { setTenantProvisioningStatus } from '@blog/db/queries/tenants/set-tenant-provisioning-status';
import { setTenantSanityToken } from '@blog/db/queries/tenants/set-tenant-sanity-token';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import {
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_READ_TOKEN,
  MOCK_TENANT_VALUES,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';

import { getTenantSanityCredentials } from './get-tenant-sanity-credentials';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useTenantTokenEncryptionKey();
useFrozenClock();

const { sanityProjectId, sanityDataset } = MOCK_TENANT_VALUES;

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantSanityCredentials, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = unwrapOk(
      await createTenant({
        ...MOCK_TENANT_VALUES,
        status: TENANT_STATUS.ACTIVE,
      }),
    );
  });

  describe('with a token set', () => {
    beforeEach(async () => {
      await setTenantSanityToken(tenant.id, MOCK_TENANT_READ_TOKEN);
    });

    it('resolves the decrypted token, project, dataset and state for an active tenant', async () => {
      const credentials = await getTenantSanityCredentials(tenant.id);

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
      await archiveTenant(tenant.id);

      const credentials = await getTenantSanityCredentials(tenant.id);

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
      vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

      await expect(getTenantSanityCredentials(tenant.id)).rejects.toThrow(
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
      await setTenantProvisioningStatus(tenant.id, status);

      const credentials = await getTenantSanityCredentials(tenant.id);

      expect(credentials).toBeUndefined();
    },
  );

  it('resolves undefined when the tenant has no token set yet', async () => {
    const credentials = await getTenantSanityCredentials(tenant.id);

    expect(credentials).toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    const credentials = await getTenantSanityCredentials(
      MOCK_MISSING_TENANT_ID,
    );

    expect(credentials).toBeUndefined();
  });
});
