import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import {
  reportDeprovisioningRunFinish,
  reportDeprovisioningRunStart,
} from './report-deprovisioning-run';

vi.mock('@blog/db/client');

const MOCK_WORKFLOW_RUN_URL = 'https://github.com/acme/blog/actions/runs/123';

const db = useQueryTestDb();

async function insertTenant(): Promise<string> {
  const [tenant] = await db()
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

async function loadTenant(tenantId: string) {
  const [tenant] = await db()
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId));

  return tenant;
}

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.restoreAllMocks();
});

describe(reportDeprovisioningRunStart, () => {
  it('writes the run start directly to Postgres', async () => {
    const tenantId = await insertTenant();

    await reportDeprovisioningRunStart({
      tenantId,
      workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.deprovisioningSteps?.run).toMatchObject({
      workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
    });
  });

  it('logs instead of throwing when the run starts for an unknown tenant id', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      reportDeprovisioningRunStart({
        tenantId: MOCK_MISSING_TENANT_ID,
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe(reportDeprovisioningRunFinish, () => {
  it('writes the run finish directly to Postgres', async () => {
    const tenantId = await insertTenant();
    await reportDeprovisioningRunStart({ tenantId });

    await reportDeprovisioningRunFinish(tenantId);

    const tenant = await loadTenant(tenantId);
    expect(tenant?.deprovisioningSteps?.run?.finishedAt).toEqual(
      expect.any(String),
    );
  });

  it('never throws when the tenant id does not exist — logs instead', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      reportDeprovisioningRunFinish(MOCK_MISSING_TENANT_ID),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
