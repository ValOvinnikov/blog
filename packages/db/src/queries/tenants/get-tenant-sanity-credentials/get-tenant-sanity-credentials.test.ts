import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import { archiveTenant } from '@blog/db/queries/tenants/archive-tenant';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import { setTenantProvisioningStatus } from '@blog/db/queries/tenants/set-tenant-provisioning-status';
import { setTenantSanityToken } from '@blog/db/queries/tenants/set-tenant-sanity-token';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import {
  MOCK_MISSING_TENANT_ID,
  MOCK_RUN_AT,
  MOCK_TENANT_READ_TOKEN,
  MOCK_TENANT_VALUES,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';

import { getTenantSanityCredentials } from './get-tenant-sanity-credentials';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
useTenantTokenEncryptionKey();

const { sanityProjectId, sanityDataset } = MOCK_TENANT_VALUES;

afterEach(async () => {
  vi.useRealTimers();
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
      vi.useFakeTimers();
      vi.setSystemTime(new Date(MOCK_RUN_AT));
      unwrapOk(await archiveTenant(tenant.id));
      vi.useRealTimers();

      const credentials = await getTenantSanityCredentials(tenant.id);

      expect(credentials).toEqual({
        projectId: sanityProjectId,
        dataset: sanityDataset,
        token: MOCK_TENANT_READ_TOKEN,
        defaultLocale: LOCALE_ISO_CODES.EN,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: new Date(MOCK_RUN_AT),
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

      await expect(
        getTenantSanityCredentials(tenant.id),
      ).resolves.toBeUndefined();
    },
  );

  it('resolves undefined when the tenant has no token set yet', async () => {
    await expect(
      getTenantSanityCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    await expect(
      getTenantSanityCredentials(MOCK_MISSING_TENANT_ID),
    ).resolves.toBeUndefined();
  });
});
