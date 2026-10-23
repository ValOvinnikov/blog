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
  MOCK_RERUN_AT,
  MOCK_RUN_AT,
  MOCK_WORKFLOW_RUN_URL,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';

import { startProvisioningRun } from './start-provisioning-run';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const DONE_STEP = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(MOCK_RUN_AT));
});

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.useRealTimers();
});

describe(startProvisioningRun, () => {
  describe('a tenant with default steps', () => {
    let tenant: Awaited<ReturnType<typeof insertTestTenant>>;

    beforeEach(async () => {
      tenant = await insertTestTenant(db());
    });

    it('writes startedAt, registry, and workflowRunUrl when all are supplied', async () => {
      const { provisioningSteps } = unwrapOk(
        await startProvisioningRun({
          tenantId: tenant.id,
          registry: MOCK_PROVISIONING_REGISTRY,
          workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
        }),
      );

      expect(provisioningSteps?.run).toEqual({
        startedAt: MOCK_RUN_AT,
        registry: MOCK_PROVISIONING_REGISTRY,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
      });
    });

    it('omits registry and workflowRunUrl entirely when not supplied', async () => {
      const { provisioningSteps } = unwrapOk(
        await startProvisioningRun({ tenantId: tenant.id }),
      );

      expect(provisioningSteps?.run).toEqual({ startedAt: MOCK_RUN_AT });
    });

    it('replaces a previous run wholesale rather than merging', async () => {
      await startProvisioningRun({
        tenantId: tenant.id,
        registry: MOCK_PROVISIONING_REGISTRY,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
      });

      vi.setSystemTime(new Date(MOCK_RERUN_AT));
      const { provisioningSteps } = unwrapOk(
        await startProvisioningRun({ tenantId: tenant.id }),
      );

      expect(provisioningSteps?.run).toEqual({ startedAt: MOCK_RERUN_AT });
    });
  });

  it('leaves every step entry untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      provisioningSteps: {
        ...MOCK_IDLE_PROVISIONING_STEPS,
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: DONE_STEP,
      },
    });

    const { provisioningSteps } = unwrapOk(
      await startProvisioningRun({ tenantId: tenant.id }),
    );

    expect(
      provisioningSteps?.[TENANT_PROVISIONING_STEP.SANITY_PROJECT],
    ).toEqual(DONE_STEP);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await startProvisioningRun({
      tenantId: MOCK_MISSING_TENANT_ID,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
