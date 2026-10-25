import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  DEPROVISIONING_STEP,
  TENANT_PLAN,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { reportDeprovisioningStepStatus } from './report-deprovisioning-step-status';

vi.mock('@blog/db/client');

const MOCK_STEP_ERROR = 'Sanity Projects API returned 429';

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
      deprovisioningSteps: {
        REMOVE_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        ARCHIVE_SANITY_PROJECT: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
        REVOKE_SANITY_TOKENS: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CLEAR_ARTIFACTS: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        ARCHIVE_TENANT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PURGE_READER_DATA: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        INVALIDATE_TENANT_CACHE: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
      },
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

describe(reportDeprovisioningStepStatus, () => {
  let tenantId: string;

  beforeEach(async () => {
    tenantId = await insertTenant();
  });

  it('writes the step status directly to Postgres', async () => {
    await reportDeprovisioningStepStatus({
      tenantId,
      step: DEPROVISIONING_STEP.REMOVE_DOMAIN,
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.deprovisioningSteps).toMatchObject({
      REMOVE_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
    });
  });

  it('stores the error message only when supplied', async () => {
    await reportDeprovisioningStepStatus({
      tenantId,
      step: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: MOCK_STEP_ERROR,
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.deprovisioningSteps).toMatchObject({
      ARCHIVE_SANITY_PROJECT: {
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: MOCK_STEP_ERROR,
      },
    });
  });

  it('never throws when the tenant id does not exist — logs instead', async () => {
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
