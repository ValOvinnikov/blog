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
  MOCK_RUN_AT,
  MOCK_STEP_ERROR,
} from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { reportDeprovisioningStepStatus } from './report-deprovisioning-step-status';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

async function loadSteps(tenantId: string) {
  const [tenant] = await db()
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId));

  return tenant?.deprovisioningSteps;
}

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe(reportDeprovisioningStepStatus, () => {
  let tenantId: string;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(MOCK_RUN_AT));
    const tenant = await insertTestTenant(db(), {
      deprovisioningSteps: MOCK_IDLE_DEPROVISIONING_STEPS,
    });
    tenantId = tenant.id;
  });

  it('persists the step status', async () => {
    await reportDeprovisioningStepStatus({
      tenantId,
      step: DEPROVISIONING_STEP.REMOVE_DOMAIN,
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    });

    const steps = await loadSteps(tenantId);
    expect(steps).toEqual({
      ...MOCK_IDLE_DEPROVISIONING_STEPS,
      [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
        status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        updatedAt: MOCK_RUN_AT,
      },
    });
  });

  it('persists the error message when supplied', async () => {
    await reportDeprovisioningStepStatus({
      tenantId,
      step: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: MOCK_STEP_ERROR,
    });

    const steps = await loadSteps(tenantId);
    expect(steps).toEqual({
      ...MOCK_IDLE_DEPROVISIONING_STEPS,
      [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: {
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: MOCK_STEP_ERROR,
        updatedAt: MOCK_RUN_AT,
      },
    });
  });

  it('logs instead of throwing for an unknown tenant id', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      reportDeprovisioningStepStatus({
        tenantId: MOCK_MISSING_TENANT_ID,
        step: DEPROVISIONING_STEP.REMOVE_DOMAIN,
        status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
