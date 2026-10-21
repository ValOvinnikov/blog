import { ERROR_CODE } from '@blog/config/constants';
import {
  SUSPENSION_REASON,
  TENANT_STATUS,
  type TTenantStatus,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { LAST_ACTIVITY_AT } from '@blog/db/testing/tenants/inactivity';
import { eq } from 'drizzle-orm';

import { setTenantSuspension } from './set-tenant-suspension';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const EXPECTED_OK = 'expected ok:true';

async function insertTenant(
  status: TTenantStatus,
  deprovisionedAt?: Date,
): Promise<string> {
  const tenant = await insertTestTenant(db(), {
    name: 'Acme',
    status,
    deprovisionedAt,
  });

  return tenant.id;
}

async function readStatus(tenantId: string) {
  const [row] = await db()
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row?.status;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSuspension, () => {
  it('suspends an active tenant', async () => {
    const tenantId = await insertTenant(TENANT_STATUS.ACTIVE);

    const result = await setTenantSuspension(tenantId, TENANT_STATUS.SUSPENDED);

    if (!result.ok) throw new Error(EXPECTED_OK);
    expect(result.data.status).toBe(TENANT_STATUS.SUSPENDED);
    expect(await readStatus(tenantId)).toBe(TENANT_STATUS.SUSPENDED);
  });

  it('reactivates a suspended tenant', async () => {
    const tenantId = await insertTenant(TENANT_STATUS.SUSPENDED);

    const result = await setTenantSuspension(tenantId, TENANT_STATUS.ACTIVE);

    if (!result.ok) throw new Error(EXPECTED_OK);
    expect(result.data.status).toBe(TENANT_STATUS.ACTIVE);
    expect(await readStatus(tenantId)).toBe(TENANT_STATUS.ACTIVE);
  });

  it('records an operator suspension over an inactivity one', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    });

    const result = await setTenantSuspension(
      tenant.id,
      TENANT_STATUS.SUSPENDED,
    );

    if (!result.ok) throw new Error(EXPECTED_OK);
    expect(result.data.suspensionReason).toBe(SUSPENSION_REASON.OPERATOR);
  });

  it('clears the suspension reason and stamp when the suspension is lifted', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspendedAt: LAST_ACTIVITY_AT,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    });

    const result = await setTenantSuspension(tenant.id, TENANT_STATUS.ACTIVE);

    if (!result.ok) throw new Error(EXPECTED_OK);
    expect(result.data.suspensionReason).toBeNull();
    expect(result.data.suspendedAt).toBeNull();
  });

  it('leaves an archived tenant archived', async () => {
    const tenantId = await insertTenant(TENANT_STATUS.ARCHIVED, new Date());

    const result = await setTenantSuspension(tenantId, TENANT_STATUS.ACTIVE);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    expect(await readStatus(tenantId)).toBe(TENANT_STATUS.ARCHIVED);
  });

  it('leaves a deprovisioned tenant untouched whatever its status', async () => {
    const tenantId = await insertTenant(TENANT_STATUS.ACTIVE, new Date());

    const result = await setTenantSuspension(tenantId, TENANT_STATUS.SUSPENDED);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    expect(await readStatus(tenantId)).toBe(TENANT_STATUS.ACTIVE);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await setTenantSuspension(
      '00000000-0000-0000-0000-000000000000',
      TENANT_STATUS.SUSPENDED,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
