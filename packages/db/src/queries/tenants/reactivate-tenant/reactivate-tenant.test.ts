import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { reactivateTenant } from './reactivate-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

type TInsertTenantOptions = {
  status: (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];
  deprovisionedAt?: Date;
  sanityProjectId?: string;
  provisioningStatus?: (typeof TENANT_PROVISIONING_STATUS)[keyof typeof TENANT_PROVISIONING_STATUS];
};

async function insertTenant(options: TInsertTenantOptions): Promise<string> {
  const tenant = await insertTestTenant(db, {
    slug: 'acme',
    name: 'Acme',
    status: options.status,
    deprovisionedAt: options.deprovisionedAt,
    sanityProjectId: options.sanityProjectId,
    provisioningStatus: options.provisioningStatus,
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

describe(reactivateTenant, () => {
  it('clears deprovisionedAt and sets status to ACTIVE for an archived tenant', async () => {
    const tenantId = await insertTenant({
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: new Date(),
    });

    const result = await reactivateTenant(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisionedAt).toBeNull();
    expect(result.data.status).toBe(TENANT_STATUS.ACTIVE);

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.deprovisionedAt).toBeNull();
    expect(row?.status).toBe(TENANT_STATUS.ACTIVE);
  });

  it('leaves a never-archived ACTIVE tenant unaffected', async () => {
    const tenantId = await insertTenant({ status: TENANT_STATUS.ACTIVE });

    const result = await reactivateTenant(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.status).toBe(TENANT_STATUS.ACTIVE);
    expect(result.data.deprovisionedAt).toBeNull();
  });

  it('keeps a SUSPENDED tenant SUSPENDED', async () => {
    const tenantId = await insertTenant({ status: TENANT_STATUS.SUSPENDED });

    const result = await reactivateTenant(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.status).toBe(TENANT_STATUS.SUSPENDED);
    expect(result.data.deprovisionedAt).toBeNull();

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.status).toBe(TENANT_STATUS.SUSPENDED);
  });

  it('does not touch provisioning-artifact columns', async () => {
    const tenantId = await insertTenant({
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: new Date(),
      sanityProjectId: 'proj-abc',
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    const result = await reactivateTenant(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.sanityProjectId).toBe('proj-abc');
    expect(result.data.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.READY,
    );
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    const result = await reactivateTenant(missingId);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
