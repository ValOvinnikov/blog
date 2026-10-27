import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenantDeprovisioningState } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_DEPROVISIONED_AT,
  MOCK_IDLE_DEPROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
} from '@blog/db/testing/tenants/fixtures';

import { getTenantDeprovisioningStatus } from './get-tenant-deprovisioning-status';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_DEPROVISIONING_STEPS: TTenantDeprovisioningState = {
  ...MOCK_IDLE_DEPROVISIONING_STEPS,
  [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  },
  [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: {
    status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  },
};

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantDeprovisioningStatus, () => {
  it('returns the per-step map and deprovisionedAt for an existing tenant', async () => {
    const { id } = await insertTestTenant(db(), {
      deprovisioningSteps: MOCK_DEPROVISIONING_STEPS,
    });

    const result = await getTenantDeprovisioningStatus(id);

    expect(result).toEqual({
      deprovisioningSteps: MOCK_DEPROVISIONING_STEPS,
      deprovisionedAt: null,
    });
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    const result = await getTenantDeprovisioningStatus(MOCK_MISSING_TENANT_ID);

    expect(result).toBeUndefined();
  });

  it('returns null fields for a tenant never deprovisioned', async () => {
    const { id } = await insertTestTenant(db());

    const result = await getTenantDeprovisioningStatus(id);

    expect(result).toEqual({
      deprovisioningSteps: null,
      deprovisionedAt: null,
    });
  });

  it('reports a finished teardown via deprovisionedAt', async () => {
    const { id } = await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: MOCK_DEPROVISIONED_AT,
    });

    const result = await getTenantDeprovisioningStatus(id);

    expect(result).toEqual({
      deprovisioningSteps: null,
      deprovisionedAt: MOCK_DEPROVISIONED_AT,
    });
  });
});
