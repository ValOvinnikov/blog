import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { beginTenantProvisioning } from './begin-tenant-provisioning';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(overrides?: {
  provisioningStatus?: (typeof TENANT_PROVISIONING_STATUS)[keyof typeof TENANT_PROVISIONING_STATUS];
}): Promise<string> {
  const tenant = await insertTestTenant(db, {
    slug: 'acme',
    provisioningStatus: overrides?.provisioningStatus,
  });

  return tenant.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(beginTenantProvisioning, () => {
  it('moves a tenant with no provisioningStatus (NULL) to PROVISIONING', async () => {
    const tenantId = await insertTenant();

    const result = await beginTenantProvisioning(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(result.data.previousProvisioningStatus).toBeNull();
  });

  it('moves a PENDING tenant to PROVISIONING and reports the prior status', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    });

    const result = await beginTenantProvisioning(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(result.data.previousProvisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PENDING,
    );
  });

  it('moves a FAILED tenant to PROVISIONING (a retry), reporting FAILED as the prior status', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
    });

    const result = await beginTenantProvisioning(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(result.data.previousProvisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.FAILED,
    );
  });

  it('refuses with DB_ALREADY_PROVISIONING and leaves the row untouched when already PROVISIONING', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });

    const result = await beginTenantProvisioning(tenantId);

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('resolves exactly one of two concurrent calls with ok:true', async () => {
    const tenantId = await insertTenant();

    const [first, second] = await Promise.all([
      beginTenantProvisioning(tenantId),
      beginTenantProvisioning(tenantId),
    ]);

    const outcomes = [first, second];
    const succeeded = outcomes.filter((result) => result.ok);
    const refused = outcomes.filter((result) => !result.ok);

    expect(succeeded).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await beginTenantProvisioning(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
