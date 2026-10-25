import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listTenantsWedgedInProvisioning } from './list-tenants-wedged-in-provisioning';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsWedgedInProvisioning, () => {
  it('includes a PROVISIONING tenant with a FAILED step', async () => {
    const tenant = await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'boom',
        },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        VERIFY_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await listTenantsWedgedInProvisioning();

    expect(result.map((row) => row.id)).toEqual([tenant.id]);
  });

  it('excludes a PROVISIONING tenant with no FAILED step (a genuine in-flight run)', async () => {
    await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        VERIFY_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
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
          SANITY_PROJECT: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
          },
          SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          VERIFY_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
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
