import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_ID,
  MOCK_RUN_AT,
  MOCK_RUN_FINISHED_AT,
  MOCK_WORKFLOW_RUN_URL,
} from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';
import type { MockInstance } from 'vitest';

import {
  reportDeprovisioningRunFinish,
  reportDeprovisioningRunStart,
} from './report-deprovisioning-run';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

async function loadRun(tenantId: string) {
  const [tenant] = await db()
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId));

  return tenant?.deprovisioningSteps?.run;
}

let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.useFakeTimers();
  vi.setSystemTime(new Date(MOCK_RUN_AT));
});

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe(reportDeprovisioningRunStart, () => {
  it('persists the run start with its workflow run url', async () => {
    const tenant = await insertTestTenant(db());

    await reportDeprovisioningRunStart({
      tenantId: tenant.id,
      workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
    });

    const run = await loadRun(tenant.id);
    expect(run).toEqual({
      startedAt: MOCK_RUN_AT,
      workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
    });
  });

  it('logs a start for an unknown tenant and resolves', async () => {
    await expect(
      reportDeprovisioningRunStart({ tenantId: MOCK_MISSING_TENANT_ID }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe(reportDeprovisioningRunFinish, () => {
  it('persists the run finish time alongside the run start', async () => {
    const tenant = await insertTestTenant(db());
    await reportDeprovisioningRunStart({ tenantId: tenant.id });

    vi.setSystemTime(new Date(MOCK_RUN_FINISHED_AT));
    await reportDeprovisioningRunFinish(tenant.id);

    const run = await loadRun(tenant.id);
    expect(run).toEqual({
      startedAt: MOCK_RUN_AT,
      finishedAt: MOCK_RUN_FINISHED_AT,
    });
  });

  it('logs a finish for an unknown tenant and resolves', async () => {
    await expect(
      reportDeprovisioningRunFinish(MOCK_MISSING_TENANT_ID),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
