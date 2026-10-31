import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_SEEDED_AT,
} from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { clearTenantProvisioningArtifacts } from './clear-tenant-provisioning-artifacts';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();
useFrozenClock();

const MOCK_DONE_STEP = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(clearTenantProvisioningArtifacts, () => {
  let tenant: TTenant;
  let cleared: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db(), {
      sanityReadTokenEncrypted: faker.string.alphanumeric(32),
      sanityWriteTokenEncrypted: faker.string.alphanumeric(32),
      sanityManagementTokenEncrypted: faker.string.alphanumeric(32),
      sanityManagementRobotId: faker.string.alphanumeric(10),
      seededAt: MOCK_SEEDED_AT,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      provisioningSteps: {
        ...MOCK_IDLE_PROVISIONING_STEPS,
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_DONE_STEP,
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: MOCK_DONE_STEP,
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: MOCK_DONE_STEP,
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: MOCK_DONE_STEP,
        [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: MOCK_DONE_STEP,
        [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: MOCK_DONE_STEP,
      },
    });
    cleared = {
      ...tenant,
      sanityReadTokenEncrypted: null,
      sanityWriteTokenEncrypted: null,
      sanityManagementTokenEncrypted: null,
      sanityManagementRobotId: null,
      provisioningStatus: null,
      provisioningSteps: null,
      seededAt: null,
      updatedAt: MOCK_NOW,
    };
  });

  it('nulls every provisioning column but keeps the archived Sanity project', async () => {
    await clearTenantProvisioningArtifacts(tenant.id);

    const rows = await db().select().from(schema.tenants);
    expect(rows).toEqual([cleared]);
  });

  it('is safe to call again once already cleared', async () => {
    await clearTenantProvisioningArtifacts(tenant.id);

    await clearTenantProvisioningArtifacts(tenant.id);

    const rows = await db().select().from(schema.tenants);
    expect(rows).toEqual([cleared]);
  });
});
