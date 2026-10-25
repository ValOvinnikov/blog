import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
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

import { startProvisioningRun } from '../start-provisioning-run';

import { finishProvisioningRun } from './finish-provisioning-run';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const FAILED_STEP = {
  status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
  error: MOCK_STEP_ERROR,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(MOCK_RUN_AT));
});

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.useRealTimers();
});

describe(finishProvisioningRun, () => {
  describe('a tenant with no run recorded', () => {
    let tenant: Awaited<ReturnType<typeof insertTestTenant>>;

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

    it('sets finishedAt on an absent run rather than throwing', async () => {
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
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: FAILED_STEP,
      },
    });

    const { provisioningSteps } = unwrapOk(
      await finishProvisioningRun({ tenantId: tenant.id }),
    );

    expect(
      provisioningSteps?.[TENANT_PROVISIONING_STEP.SANITY_PROJECT],
    ).toEqual(FAILED_STEP);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await finishProvisioningRun({
      tenantId: MOCK_MISSING_TENANT_ID,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
