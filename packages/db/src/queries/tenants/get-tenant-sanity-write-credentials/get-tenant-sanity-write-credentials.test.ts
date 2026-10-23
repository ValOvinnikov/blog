import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import { archiveTenant } from '@blog/db/queries/tenants/archive-tenant';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import { setTenantProvisioningStatus } from '@blog/db/queries/tenants/set-tenant-provisioning-status';
import { setTenantSanityToken } from '@blog/db/queries/tenants/set-tenant-sanity-token';
import { setTenantSanityWriteToken } from '@blog/db/queries/tenants/set-tenant-sanity-write-token';
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
  MOCK_TENANT_WRITE_TOKEN,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import {
  getTenantSanityWriteCredentials,
  toTenantSanityWriteCredentials,
} from './get-tenant-sanity-write-credentials';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
useTenantTokenEncryptionKey();

const { sanityProjectId, sanityDataset } = MOCK_TENANT_VALUES;

const ACTIVE_WRITE_CREDENTIALS = {
  projectId: sanityProjectId,
  dataset: sanityDataset,
  token: MOCK_TENANT_WRITE_TOKEN,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: null,
};

async function insertTenant(): Promise<TTenant> {
  return unwrapOk(
    await createTenant({ ...MOCK_TENANT_VALUES, status: TENANT_STATUS.ACTIVE }),
  );
}

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.tenants);
});

describe(getTenantSanityWriteCredentials, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTenant();
  });

  describe('with a write token set', () => {
    beforeEach(async () => {
      await setTenantSanityWriteToken(tenant.id, MOCK_TENANT_WRITE_TOKEN);
    });

    it('resolves the decrypted token, project, dataset and state for an active tenant', async () => {
      const credentials = await getTenantSanityWriteCredentials(tenant.id);

      expect(credentials).toEqual(ACTIVE_WRITE_CREDENTIALS);
    });

    it('still resolves write credentials for an archived tenant, with its deprovisionedAt', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(MOCK_RUN_AT));
      unwrapOk(await archiveTenant(tenant.id));
      vi.useRealTimers();

      const credentials = await getTenantSanityWriteCredentials(tenant.id);

      expect(credentials).toEqual({
        ...ACTIVE_WRITE_CREDENTIALS,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: new Date(MOCK_RUN_AT),
      });
    });

    it('throws when the encryption key is not configured', async () => {
      vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

      await expect(getTenantSanityWriteCredentials(tenant.id)).rejects.toThrow(
        MISSING_TENANT_TOKEN_KEY_ERROR,
      );
    });
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PROVISIONING,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])(
    'resolves undefined for a %s tenant with no write token set yet',
    async (status) => {
      await setTenantProvisioningStatus(tenant.id, status);

      await expect(
        getTenantSanityWriteCredentials(tenant.id),
      ).resolves.toBeUndefined();
    },
  );

  it('resolves undefined when the tenant has no write token set yet', async () => {
    await expect(
      getTenantSanityWriteCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined when only the read token is set, not the write token', async () => {
    await setTenantSanityToken(tenant.id, MOCK_TENANT_READ_TOKEN);

    await expect(
      getTenantSanityWriteCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    await expect(
      getTenantSanityWriteCredentials(MOCK_MISSING_TENANT_ID),
    ).resolves.toBeUndefined();
  });
});

describe(toTenantSanityWriteCredentials, () => {
  async function insertTenantRow(writeToken?: string): Promise<TTenant> {
    const tenant = await insertTenant();
    if (writeToken) await setTenantSanityWriteToken(tenant.id, writeToken);
    const [row] = await db()
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenant.id));
    if (!row) throw new Error('setup: tenant row missing.');
    return row;
  }

  describe('a row with a write token', () => {
    let row: TTenant;

    beforeEach(async () => {
      row = await insertTenantRow(MOCK_TENANT_WRITE_TOKEN);
    });

    it('maps a row with a write token to decrypted credentials and state', async () => {
      expect(toTenantSanityWriteCredentials(row)).toEqual(
        ACTIVE_WRITE_CREDENTIALS,
      );
    });

    it('throws mapping the row when the encryption key is not configured', async () => {
      vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

      expect(() => toTenantSanityWriteCredentials(row)).toThrow(
        MISSING_TENANT_TOKEN_KEY_ERROR,
      );
    });
  });

  it('returns undefined for a row with no write token', async () => {
    expect(toTenantSanityWriteCredentials(await insertTenantRow())).toBe(
      undefined,
    );
  });
});
