import { ERROR_CODE } from '@blog/config/constants';
import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_DEPROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
  MOCK_RERUN_AT,
  MOCK_RUN_AT,
  MOCK_WORKFLOW_RUN_URL,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';

import { startDeprovisioningRun } from './start-deprovisioning-run';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const DONE_STEP = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(MOCK_RUN_AT));
});

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.useRealTimers();
});

describe(startDeprovisioningRun, () => {
  describe('a tenant with default steps', () => {
    let tenant: Awaited<ReturnType<typeof insertTestTenant>>;

    beforeEach(async () => {
      tenant = await insertTestTenant(db());
    });

    it('writes startedAt and workflowRunUrl when supplied', async () => {
      const { deprovisioningSteps } = unwrapOk(
        await startDeprovisioningRun({
          tenantId: tenant.id,
          workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
        }),
      );

      expect(deprovisioningSteps?.run).toEqual({
        startedAt: MOCK_RUN_AT,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
      });
    });

    it('omits workflowRunUrl entirely when not supplied', async () => {
      const { deprovisioningSteps } = unwrapOk(
        await startDeprovisioningRun({ tenantId: tenant.id }),
      );

      expect(deprovisioningSteps?.run).toEqual({ startedAt: MOCK_RUN_AT });
    });

    it('replaces a previous run wholesale rather than merging', async () => {
      await startDeprovisioningRun({
        tenantId: tenant.id,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
      });

      vi.setSystemTime(new Date(MOCK_RERUN_AT));
      const { deprovisioningSteps } = unwrapOk(
        await startDeprovisioningRun({ tenantId: tenant.id }),
      );

      expect(deprovisioningSteps?.run).toEqual({ startedAt: MOCK_RERUN_AT });
    });
  });

  it('leaves every step entry untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      deprovisioningSteps: {
        ...MOCK_IDLE_DEPROVISIONING_STEPS,
        [DEPROVISIONING_STEP.REMOVE_DOMAIN]: DONE_STEP,
      },
    });

    const { deprovisioningSteps } = unwrapOk(
      await startDeprovisioningRun({ tenantId: tenant.id }),
    );

    expect(deprovisioningSteps?.[DEPROVISIONING_STEP.REMOVE_DOMAIN]).toEqual(
      DONE_STEP,
    );
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await startDeprovisioningRun({
      tenantId: MOCK_MISSING_TENANT_ID,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
