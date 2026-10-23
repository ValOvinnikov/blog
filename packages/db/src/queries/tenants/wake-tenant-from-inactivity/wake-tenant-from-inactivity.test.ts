import {
  DEPROVISIONING_STEP,
  SUSPENSION_REASON,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import { startDeprovisioningRun } from '@blog/db/queries/tenants/start-deprovisioning-run';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_IDLE_DEPROVISIONING_STEPS } from '@blog/db/testing/tenants/fixtures';
import { MOCK_LAST_ACTIVITY_AT } from '@blog/db/testing/tenants/inactivity';
import { eq } from 'drizzle-orm';

import { wakeTenantFromInactivity } from './wake-tenant-from-inactivity';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

async function insertTenantSuspendedForInactivity(
  overrides: Parameters<typeof insertTestTenant>[1] = {},
) {
  return insertTestTenant(db(), {
    status: TENANT_STATUS.SUSPENDED,
    suspensionReason: SUSPENSION_REASON.INACTIVITY,
    ...overrides,
  });
}

async function readSuspension(tenantId: string) {
  const [row] = await db()
    .select({
      status: tenants.status,
      suspendedAt: tenants.suspendedAt,
      suspensionReason: tenants.suspensionReason,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(wakeTenantFromInactivity, () => {
  it('reactivates a tenant suspended for inactivity and clears its suspension', async () => {
    const tenant = await insertTenantSuspendedForInactivity({
      suspendedAt: MOCK_LAST_ACTIVITY_AT,
    });

    const woken = await wakeTenantFromInactivity(tenant.id);

    expect(woken?.id).toBe(tenant.id);
    expect(await readSuspension(tenant.id)).toEqual({
      status: TENANT_STATUS.ACTIVE,
      suspendedAt: null,
      suspensionReason: null,
    });
  });

  it('wakes a tenant only once', async () => {
    const tenant = await insertTenantSuspendedForInactivity();

    await wakeTenantFromInactivity(tenant.id);

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
  });

  it('leaves an operator suspension in place', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.OPERATOR,
    });

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
    expect(await readSuspension(tenant.id)).toEqual({
      status: TENANT_STATUS.SUSPENDED,
      suspendedAt: null,
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
    const tenant = await insertTenantSuspendedForInactivity({
      deprovisionedAt: MOCK_LAST_ACTIVITY_AT,
    });

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
    expect((await readSuspension(tenant.id))?.status).toBe(
      TENANT_STATUS.SUSPENDED,
    );
  });

  it('leaves a tenant suspended once a deprovisioning step is recorded', async () => {
    const tenant = await insertTenantSuspendedForInactivity({
      deprovisioningSteps: {
        run: { startedAt: MOCK_LAST_ACTIVITY_AT.toISOString() },
        ...MOCK_IDLE_DEPROVISIONING_STEPS,
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
      },
    });

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
    expect((await readSuspension(tenant.id))?.status).toBe(
      TENANT_STATUS.SUSPENDED,
    );
  });

  it('leaves a tenant suspended once its deprovisioning run has started', async () => {
    const tenant = await insertTenantSuspendedForInactivity({
      deprovisioningSteps: null,
    });
    await startDeprovisioningRun({ tenantId: tenant.id });

    expect(await wakeTenantFromInactivity(tenant.id)).toBeNull();
  });
});
