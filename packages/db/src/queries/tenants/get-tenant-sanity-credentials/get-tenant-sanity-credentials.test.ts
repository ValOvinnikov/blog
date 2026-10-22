import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
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

import { getTenantSanityCredentials } from './get-tenant-sanity-credentials';

async function insertTenant(): Promise<TTenant> {
  const result = await createTenant({
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'abc123',
    sanityDataset: 'production',
    locale: LOCALE_ISO_CODES.EN,
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
  });
  if (!result.ok) throw new Error('setup: createTenant failed.');
  return result.data;
}

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const READ_TOKEN = 'sk-real-token-value';

const db = useQueryTestDb(getDbMock);
useTenantTokenEncryptionKey();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantSanityCredentials, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTenant();
  });

  describe('with a token set', () => {
    beforeEach(async () => {
      await setTenantSanityToken(tenant.id, READ_TOKEN);
    });

    it('resolves the decrypted token alongside project/dataset and servable state for an active tenant', async () => {
      const credentials = await getTenantSanityCredentials(tenant.id);

      expect(credentials).toEqual({
        projectId: 'abc123',
        dataset: 'production',
        token: READ_TOKEN,
        defaultLocale: LOCALE_ISO_CODES.EN,
        status: TENANT_STATUS.ACTIVE,
        deprovisionedAt: null,
        provisioningStatus: null,
      });
    });

    it('still resolves working credentials for an archived tenant, tagged with its ARCHIVED status', async () => {
      const archived = await archiveTenant(tenant.id);
      if (!archived.ok) throw new Error('setup: archiveTenant failed.');

      const credentials = await getTenantSanityCredentials(tenant.id);

      expect(credentials).toMatchObject({
        projectId: 'abc123',
        dataset: 'production',
        token: READ_TOKEN,
        status: TENANT_STATUS.ARCHIVED,
      });
    });

    it('surfaces deprovisionedAt for a deprovisioned tenant instead of collapsing to undefined', async () => {
      await archiveTenant(tenant.id);

      const credentials = await getTenantSanityCredentials(tenant.id);

      expect(credentials?.deprovisionedAt).toBeInstanceOf(Date);
    });

    it('throws when the encryption key is not configured', async () => {
      vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

      await expect(getTenantSanityCredentials(tenant.id)).rejects.toThrow(
        MISSING_TENANT_TOKEN_KEY_ERROR,
      );
    });
  });

  it('resolves undefined for a mid-provisioning tenant with no token set yet', async () => {
    await setTenantProvisioningStatus(
      tenant.id,
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );

    await expect(
      getTenantSanityCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for a tenant whose provisioning failed and never set a token', async () => {
    await setTenantProvisioningStatus(
      tenant.id,
      TENANT_PROVISIONING_STATUS.FAILED,
    );

    await expect(
      getTenantSanityCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined when the tenant has no token set yet', async () => {
    await expect(
      getTenantSanityCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    await expect(
      getTenantSanityCredentials('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });
});
