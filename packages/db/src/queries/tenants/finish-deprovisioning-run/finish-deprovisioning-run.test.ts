import { ERROR_CODE } from '@shinefold/config/constants';
import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@shinefold/db/constants';
import { startDeprovisioningRun } from '@shinefold/db/queries/tenants/start-deprovisioning-run';
import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_IDLE_DEPROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
  MOCK_RUN_AT,
  MOCK_RUN_FINISHED_AT,
  MOCK_STEP_ERROR,
  MOCK_WORKFLOW_RUN_URL,
  unwrapOk,
} from '@shinefold/db/testing/tenants/fixtures';

import { finishDeprovisioningRun } from './finish-deprovisioning-run';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useFrozenClock(new Date(MOCK_RUN_AT));

const MOCK_FAILED_STEP = {
  status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
  error: MOCK_STEP_ERROR,
};

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(finishDeprovisioningRun, () => {
  describe('a tenant with no run recorded', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db());
    });

    it('merges finishedAt without clobbering startedAt/workflowRunUrl', async () => {
      await startDeprovisioningRun({
        tenantId: tenant.id,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
      });

      vi.setSystemTime(new Date(MOCK_RUN_FINISHED_AT));
      const { deprovisioningSteps } = unwrapOk(
        await finishDeprovisioningRun({ tenantId: tenant.id }),
      );

      expect(deprovisioningSteps?.run).toEqual({
        startedAt: MOCK_RUN_AT,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
        finishedAt: MOCK_RUN_FINISHED_AT,
      });
    });

    it('sets finishedAt on an absent run', async () => {
      const { deprovisioningSteps } = unwrapOk(
        await finishDeprovisioningRun({ tenantId: tenant.id }),
      );

      expect(deprovisioningSteps?.run).toEqual({ finishedAt: MOCK_RUN_AT });
    });
  });

  it('leaves every step entry untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      deprovisioningSteps: {
        ...MOCK_IDLE_DEPROVISIONING_STEPS,
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: MOCK_FAILED_STEP,
      },
    });

    const { deprovisioningSteps } = unwrapOk(
      await finishDeprovisioningRun({ tenantId: tenant.id }),
    );

    expect(deprovisioningSteps?.[DEPROVISIONING_STEP.REMOVE_DOMAIN]).toEqual(
      MOCK_FAILED_STEP,
    );
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await finishDeprovisioningRun({
      tenantId: MOCK_MISSING_TENANT_ID,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
