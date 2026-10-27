import {
  DEPROVISIONING_STEP,
  SUSPENSION_REASON,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import { startDeprovisioningRun } from '@blog/db/queries/tenants/start-deprovisioning-run';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_IDLE_DEPROVISIONING_STEPS } from '@blog/db/testing/tenants/fixtures';
import { MOCK_LAST_ACTIVITY_AT } from '@blog/db/testing/tenants/inactivity';

import { wakeTenantFromInactivity } from './wake-tenant-from-inactivity';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

async function insertTenantSuspendedForInactivity(
  overrides: Parameters<typeof insertTestTenant>[1] = {},
) {
  return insertTestTenant(db(), {
    status: TENANT_STATUS.SUSPENDED,
    suspensionReason: SUSPENSION_REASON.INACTIVITY,
    ...overrides,
  });
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(wakeTenantFromInactivity, () => {
  it('reactivates a tenant suspended for inactivity and clears its suspension', async () => {
    const tenant = await insertTenantSuspendedForInactivity({
      suspendedAt: MOCK_LAST_ACTIVITY_AT,
    });
    const woken = {
      ...tenant,
      status: TENANT_STATUS.ACTIVE,
      suspendedAt: null,
      suspensionReason: null,
      updatedAt: MOCK_NOW,
    };

    const result = await wakeTenantFromInactivity(tenant.id);

    const rows = await db().select().from(schema.tenants);
    expect(result).toEqual(woken);
    expect(rows).toEqual([woken]);
  });

  it('wakes a tenant only once', async () => {
    const tenant = await insertTenantSuspendedForInactivity();
    await wakeTenantFromInactivity(tenant.id);

    const result = await wakeTenantFromInactivity(tenant.id);

    expect(result).toBeNull();
  });

  it.each([
    [
      'an operator suspension',
      {
        status: TENANT_STATUS.SUSPENDED,
        suspensionReason: SUSPENSION_REASON.OPERATOR,
      },
    ],
    ['an active tenant', { status: TENANT_STATUS.ACTIVE }],
    [
      'a deprovisioned tenant',
      {
        status: TENANT_STATUS.SUSPENDED,
        suspensionReason: SUSPENSION_REASON.INACTIVITY,
        deprovisionedAt: MOCK_LAST_ACTIVITY_AT,
      },
    ],
    [
      'a tenant with a deprovisioning step recorded',
      {
        status: TENANT_STATUS.SUSPENDED,
        suspensionReason: SUSPENSION_REASON.INACTIVITY,
        deprovisioningSteps: {
          run: { startedAt: MOCK_LAST_ACTIVITY_AT.toISOString() },
          ...MOCK_IDLE_DEPROVISIONING_STEPS,
          [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        },
      },
    ],
  ])('leaves %s untouched', async (_description, overrides) => {
    const tenant = await insertTestTenant(db(), overrides);

    const result = await wakeTenantFromInactivity(tenant.id);

    const rows = await db().select().from(schema.tenants);
    expect(result).toBeNull();
    expect(rows).toEqual([tenant]);
  });

  it('leaves a tenant suspended once its deprovisioning run has started', async () => {
    const tenant = await insertTenantSuspendedForInactivity({
      deprovisioningSteps: null,
    });
    await startDeprovisioningRun({ tenantId: tenant.id });

    const result = await wakeTenantFromInactivity(tenant.id);

    expect(result).toBeNull();
  });
});
