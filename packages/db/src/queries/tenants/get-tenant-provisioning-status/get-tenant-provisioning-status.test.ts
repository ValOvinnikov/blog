import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
} from '@blog/db/testing/tenants/fixtures';

import { getTenantProvisioningStatus } from './get-tenant-provisioning-status';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_PROVISIONING_STEPS: TTenantProvisioningState = {
  ...MOCK_IDLE_PROVISIONING_STEPS,
  [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  },
  [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
    status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  },
};

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantProvisioningStatus, () => {
  it('returns the overall status and per-step map for an existing tenant', async () => {
    const { id } = await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: MOCK_PROVISIONING_STEPS,
    });

    const result = await getTenantProvisioningStatus(id);

    expect(result).toEqual({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: MOCK_PROVISIONING_STEPS,
    });
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    const result = await getTenantProvisioningStatus(MOCK_MISSING_TENANT_ID);

    expect(result).toBeUndefined();
  });

  it('returns null fields for a tenant that predates provisioning tracking', async () => {
    const { id } = await insertTestTenant(db());

    const result = await getTenantProvisioningStatus(id);

    expect(result).toEqual({
      provisioningStatus: null,
      provisioningSteps: null,
    });
  });
});
