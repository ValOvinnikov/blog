import { ERROR_CODE } from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import {
  TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES,
  TENANT_PROVISIONING_RUN_STALE_AFTER_MINUTES,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import { setTenantProvisioningStatus } from '@blog/db/queries/tenants/set-tenant-provisioning-status';
import * as schema from '@blog/db/schema';
import type {
  TTenant,
  TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
  MOCK_STEP_ERROR,
} from '@blog/db/testing/tenants/fixtures';
import { errorResult, okResult } from '@blog/utils';

import { beginTenantProvisioning } from './begin-tenant-provisioning';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

const { DONE, FAILED, RUNNING } = TENANT_PROVISIONING_STEP_STATUS;
const { PROVISIONING } = TENANT_PROVISIONING_STATUS;

function minutesBeforeNow(minutes: number): string {
  return new Date(MOCK_NOW.getTime() - minutes * 60_000).toISOString();
}

const MOCK_NOW_ISO = MOCK_NOW.toISOString();
const MOCK_WEDGED_STARTED_AT = minutesBeforeNow(
  TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES + 1,
);
const MOCK_FAILED_STEP = {
  status: FAILED,
  error: MOCK_STEP_ERROR,
  updatedAt: MOCK_WEDGED_STARTED_AT,
};
const MOCK_IN_FLIGHT_STEPS: TTenantProvisioningState = {
  ...MOCK_IDLE_PROVISIONING_STEPS,
  [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: { status: DONE },
  [TENANT_PROVISIONING_STEP.SEED_CONTENT]: { status: RUNNING },
};
const MOCK_ALREADY_PROVISIONING = errorResult(
  ERROR_CODE.DB_ALREADY_PROVISIONING,
);

const MOCK_RETRY_AT = new Date(
  MOCK_NOW.getTime() +
    (TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES + 1) * 60_000,
);

function admitted(
  tenant: TTenant,
  previousProvisioningStatus: TMaybeNull<TTenantProvisioningStatus>,
  admittedAt: Date = MOCK_NOW,
) {
  return okResult({
    tenant: {
      ...tenant,
      provisioningStatus: PROVISIONING,
      provisioningSteps: {
        ...tenant.provisioningSteps,
        run: {
          ...tenant.provisioningSteps?.run,
          admittedAt: admittedAt.toISOString(),
        },
      },
      updatedAt: admittedAt,
    },
    previousProvisioningStatus,
  });
}

function insertProvisioningTenant(provisioningSteps: TTenantProvisioningState) {
  return insertTestTenant(db(), {
    provisioningStatus: PROVISIONING,
    provisioningSteps,
  });
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(beginTenantProvisioning, () => {
  describe('a tenant with no provisioningStatus', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db());
    });

    it('moves it to PROVISIONING, reporting no prior status', async () => {
      const result = await beginTenantProvisioning(tenant.id);

      expect(result).toEqual(admitted(tenant, null));
    });

    it('resolves exactly one of two concurrent calls with ok:true', async () => {
      const outcomes = await Promise.all([
        beginTenantProvisioning(tenant.id),
        beginTenantProvisioning(tenant.id),
      ]);

      const rows = await db().select().from(schema.tenants);
      expect(outcomes).toContainEqual(admitted(tenant, null));
      expect(outcomes).toContainEqual(MOCK_ALREADY_PROVISIONING);
      expect(rows).toEqual([admitted(tenant, null).data.tenant]);
    });
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PENDING,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])(
    'moves a %s tenant to PROVISIONING and reports the prior status',
    async (provisioningStatus) => {
      const tenant = await insertTestTenant(db(), { provisioningStatus });

      const result = await beginTenantProvisioning(tenant.id);

      expect(result).toEqual(admitted(tenant, provisioningStatus));
    },
  );

  it.each([
    ['a run with no steps recorded yet', { provisioningStatus: PROVISIONING }],
    [
      'a live run carrying a FAILED step from before it started',
      {
        provisioningStatus: PROVISIONING,
        provisioningSteps: {
          ...MOCK_IN_FLIGHT_STEPS,
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
            ...MOCK_FAILED_STEP,
            updatedAt: minutesBeforeNow(
              TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES + 6,
            ),
          },
          [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: { status: RUNNING },
          run: { startedAt: MOCK_WEDGED_STARTED_AT },
        },
      },
    ],
    [
      'a run started just now, with no FAILED step and no finishedAt',
      {
        provisioningStatus: PROVISIONING,
        provisioningSteps: {
          ...MOCK_IN_FLIGHT_STEPS,
          run: { startedAt: MOCK_NOW_ISO },
        },
      },
    ],
  ])('refuses %s, leaving the row untouched', async (_, overrides) => {
    const tenant = await insertTestTenant(db(), overrides);

    const result = await beginTenantProvisioning(tenant.id);

    const rows = await db().select().from(schema.tenants);
    expect(result).toEqual(MOCK_ALREADY_PROVISIONING);
    expect(rows).toEqual([tenant]);
  });

  it('admits a PROVISIONING tenant whose run recorded finishedAt', async () => {
    const tenant = await insertProvisioningTenant({
      ...MOCK_IDLE_PROVISIONING_STEPS,
      [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: { status: DONE },
      [TENANT_PROVISIONING_STEP.SEED_CONTENT]: { status: DONE },
      [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: { status: DONE },
      [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: { status: DONE },
      [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: { status: DONE },
      [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: { status: DONE },
      run: {
        startedAt: MOCK_WEDGED_STARTED_AT,
        finishedAt: minutesBeforeNow(
          TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES,
        ),
      },
    });

    const result = await beginTenantProvisioning(tenant.id);

    expect(result).toEqual(admitted(tenant, PROVISIONING));
  });

  it('admits a PROVISIONING run started before the staleness backstop', async () => {
    const tenant = await insertProvisioningTenant({
      ...MOCK_IN_FLIGHT_STEPS,
      run: {
        startedAt: minutesBeforeNow(
          TENANT_PROVISIONING_RUN_STALE_AFTER_MINUTES + 1,
        ),
      },
    });

    const result = await beginTenantProvisioning(tenant.id);

    expect(result).toEqual(admitted(tenant, PROVISIONING));
  });

  describe('a PROVISIONING tenant wedged with a FAILED step', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertProvisioningTenant({
        ...MOCK_IDLE_PROVISIONING_STEPS,
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: { status: DONE },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: MOCK_FAILED_STEP,
        run: { startedAt: MOCK_WEDGED_STARTED_AT },
      });
    });

    it('admits it, preserving the FAILED step and the run start', async () => {
      const result = await beginTenantProvisioning(tenant.id);

      expect(result).toEqual(admitted(tenant, PROVISIONING));
    });

    it('refuses again right after a reverted dispatch, until the debounce elapses', async () => {
      await beginTenantProvisioning(tenant.id);
      await setTenantProvisioningStatus(tenant.id, PROVISIONING);

      const immediateRetry = await beginTenantProvisioning(tenant.id);
      vi.setSystemTime(MOCK_RETRY_AT);
      const delayedRetry = await beginTenantProvisioning(tenant.id);

      expect(immediateRetry).toEqual(MOCK_ALREADY_PROVISIONING);
      expect(delayedRetry).toEqual(
        admitted(tenant, PROVISIONING, MOCK_RETRY_AT),
      );
    });

    it('resolves exactly one of two near-simultaneous calls', async () => {
      const outcomes = await Promise.all([
        beginTenantProvisioning(tenant.id),
        beginTenantProvisioning(tenant.id),
      ]);

      const rows = await db().select().from(schema.tenants);
      expect(outcomes).toContainEqual(admitted(tenant, PROVISIONING));
      expect(outcomes).toContainEqual(MOCK_ALREADY_PROVISIONING);
      expect(rows).toEqual([admitted(tenant, PROVISIONING).data.tenant]);
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await beginTenantProvisioning(MOCK_MISSING_TENANT_ID);

    expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
  });
});
