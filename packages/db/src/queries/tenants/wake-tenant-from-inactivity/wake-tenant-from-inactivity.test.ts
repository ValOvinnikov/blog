import { SUSPENSION_REASON, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { LAST_ACTIVITY_AT } from '@blog/db/testing/tenants/inactivity';
import { eq } from 'drizzle-orm';

import { wakeTenantFromInactivity } from './wake-tenant-from-inactivity';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

async function readTenant(tenantId: string) {
  const [row] = await db()
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(wakeTenantFromInactivity, () => {
  it('returns a tenant suspended for inactivity to active and clears its suspension', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspendedAt: LAST_ACTIVITY_AT,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    });

    const woken = await wakeTenantFromInactivity(tenant.id);

    expect(woken?.id).toBe(tenant.id);
    expect(await readTenant(tenant.id)).toMatchObject({
      status: TENANT_STATUS.ACTIVE,
      suspendedAt: null,
      suspensionReason: null,
    });
  });

  it('wakes a tenant only once', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    });

    await wakeTenantFromInactivity(tenant.id);

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
  });

  it('leaves an operator suspension in place', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.OPERATOR,
    });

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
    expect(await readTenant(tenant.id)).toMatchObject({
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.OPERATOR,
    });
  });

  it('leaves an active tenant untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.ACTIVE,
    });

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
  });

  it('leaves a deprovisioned tenant untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
      deprovisionedAt: LAST_ACTIVITY_AT,
    });

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
    expect((await readTenant(tenant.id))?.status).toBe(TENANT_STATUS.SUSPENDED);
  });
});
