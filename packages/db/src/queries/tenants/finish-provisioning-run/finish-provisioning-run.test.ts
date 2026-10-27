import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { startProvisioningRun } from '@blog/db/queries/tenants/start-provisioning-run';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
  MOCK_PROVISIONING_REGISTRY,
  MOCK_RUN_AT,
  MOCK_RUN_FINISHED_AT,
  MOCK_STEP_ERROR,
  MOCK_WORKFLOW_RUN_URL,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';

import { finishProvisioningRun } from './finish-provisioning-run';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock(new Date(MOCK_RUN_AT));

const MOCK_FAILED_STEP = {
  status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
  error: MOCK_STEP_ERROR,
};

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(finishProvisioningRun, () => {
  describe('a tenant with no run recorded', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db());
    });

    it('merges finishedAt without clobbering startedAt/registry/workflowRunUrl', async () => {
      await startProvisioningRun({
        tenantId: tenant.id,
        registry: MOCK_PROVISIONING_REGISTRY,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
      });

      vi.setSystemTime(new Date(MOCK_RUN_FINISHED_AT));
      const { provisioningSteps } = unwrapOk(
        await finishProvisioningRun({ tenantId: tenant.id }),
      );

      expect(provisioningSteps?.run).toEqual({
        startedAt: MOCK_RUN_AT,
        registry: MOCK_PROVISIONING_REGISTRY,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
        finishedAt: MOCK_RUN_FINISHED_AT,
      });
    });

    it('sets finishedAt on an absent run', async () => {
      const { provisioningSteps } = unwrapOk(
        await finishProvisioningRun({ tenantId: tenant.id }),
      );

      expect(provisioningSteps?.run).toEqual({ finishedAt: MOCK_RUN_AT });
    });
  });

  it('leaves every step entry untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      provisioningSteps: {
        ...MOCK_IDLE_PROVISIONING_STEPS,
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_FAILED_STEP,
      },
    });

    const { provisioningSteps } = unwrapOk(
      await finishProvisioningRun({ tenantId: tenant.id }),
    );

    expect(
      provisioningSteps?.[TENANT_PROVISIONING_STEP.SANITY_PROJECT],
    ).toEqual(MOCK_FAILED_STEP);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await finishProvisioningRun({
      tenantId: MOCK_MISSING_TENANT_ID,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
