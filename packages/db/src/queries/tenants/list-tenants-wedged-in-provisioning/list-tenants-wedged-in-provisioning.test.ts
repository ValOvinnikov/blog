import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_STEP_ERROR,
} from '@blog/db/testing/tenants/fixtures';

import { listTenantsWedgedInProvisioning } from './list-tenants-wedged-in-provisioning';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_FAILED_STEP = {
  status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
  error: MOCK_STEP_ERROR,
};

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsWedgedInProvisioning, () => {
  it('includes a PROVISIONING tenant with a FAILED step', async () => {
    const tenant = await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        ...MOCK_IDLE_PROVISIONING_STEPS,
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: MOCK_FAILED_STEP,
      },
    });

    const result = await listTenantsWedgedInProvisioning();

    expect(result).toEqual([tenant]);
  });

  it('excludes a PROVISIONING tenant with no FAILED step (a genuine in-flight run)', async () => {
    await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        ...MOCK_IDLE_PROVISIONING_STEPS,
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });

    const result = await listTenantsWedgedInProvisioning();

    expect(result).toEqual([]);
  });

  it('excludes a PROVISIONING tenant with no provisioningSteps at all', async () => {
    await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });

    const result = await listTenantsWedgedInProvisioning();

    expect(result).toEqual([]);
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PENDING,
    TENANT_PROVISIONING_STATUS.READY,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])(
    'excludes a tenant with a FAILED step but overall status %s',
    async (status) => {
      await insertTestTenant(db(), {
        provisioningStatus: status,
        provisioningSteps: {
          ...MOCK_IDLE_PROVISIONING_STEPS,
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_FAILED_STEP,
        },
      });

      const result = await listTenantsWedgedInProvisioning();

      expect(result).toEqual([]);
    },
  );

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenantsWedgedInProvisioning();

    expect(result).toEqual([]);
  });
});
