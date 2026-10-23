import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
  type TTenantProvisioningStatus,
  type TTenantStatus,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { testPersonalEmailIndex } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_SANITY_PROJECT_ID } from '@blog/db/testing/sanity-management-client/fixtures';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { MOCK_SELF_SERVE_OWNER_EMAIL } from '@blog/db/testing/tenants/self-serve-fixtures';
import { errorResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

import { reactivateTenant } from './reactivate-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const EXPECTED_OK = 'expected ok:true';

type TInsertTenantOptions = {
  status: TTenantStatus;
  deprovisionedAt?: Date;
  sanityProjectId?: string;
  provisioningStatus?: TTenantProvisioningStatus;
};

async function insertTenant(options: TInsertTenantOptions): Promise<string> {
  const tenant = await insertTestTenant(db(), {
    name: 'Acme',
    status: options.status,
    deprovisionedAt: options.deprovisionedAt,
    sanityProjectId: options.sanityProjectId,
    provisioningStatus: options.provisioningStatus,
  });

  return tenant.id;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(reactivateTenant, () => {
  it('clears deprovisionedAt and sets status to ACTIVE for an archived tenant', async () => {
    const tenantId = await insertTenant({
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: new Date(),
    });

    const result = await reactivateTenant(tenantId);

    if (!result.ok) throw new Error(EXPECTED_OK);
    expect(result.data.deprovisionedAt).toBeNull();
    expect(result.data.status).toBe(TENANT_STATUS.ACTIVE);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.deprovisionedAt).toBeNull();
    expect(row?.status).toBe(TENANT_STATUS.ACTIVE);
  });

  it.each([TENANT_STATUS.ACTIVE, TENANT_STATUS.SUSPENDED])(
    'leaves a %s tenant at that status and not deprovisioned',
    async (status) => {
      const tenantId = await insertTenant({ status });

      const result = await reactivateTenant(tenantId);

      if (!result.ok) throw new Error(EXPECTED_OK);
      expect(result.data.status).toBe(status);
      expect(result.data.deprovisionedAt).toBeNull();

      const [row] = await db()
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      expect(row?.status).toBe(status);
    },
  );

  it('does not touch provisioning-artifact columns', async () => {
    const tenantId = await insertTenant({
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: new Date(),
      sanityProjectId: MOCK_SANITY_PROJECT_ID,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    const result = await reactivateTenant(tenantId);

    if (!result.ok) throw new Error(EXPECTED_OK);
    expect(result.data.sanityProjectId).toBe(MOCK_SANITY_PROJECT_ID);
    expect(result.data.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.READY,
    );
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await reactivateTenant(MOCK_MISSING_TENANT_ID);

    expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
  });

  it('refuses with DB_ALREADY_OWNS_FREE_TENANT when the owner took a new Free slot', async () => {
    const selfServeOwnerEmailIndex = testPersonalEmailIndex(
      MOCK_SELF_SERVE_OWNER_EMAIL,
    );
    const archivedAt = new Date();
    const { id } = await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: archivedAt,
      selfServeOwnerEmailIndex,
    });
    await insertTestTenant(db(), { selfServeOwnerEmailIndex });

    const result = await reactivateTenant(id);

    expect(result).toEqual(errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT));
    const [row] = await db().select().from(tenants).where(eq(tenants.id, id));
    expect(row).toMatchObject({
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: archivedAt,
    });
  });
});
