import { faker } from '@faker-js/faker';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_SEEDED_AT,
} from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { clearTenantProvisioningArtifacts } from './clear-tenant-provisioning-artifacts';

vi.mock('@shinefold/db/client');

faker.seed(6020);

const MOCK_DONE_STEP = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };

const db = useQueryTestDb();
const tenant = useTestTenant(db, {
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
useFrozenClock();

describe(clearTenantProvisioningArtifacts, () => {
  let cleared: TTenant;

  beforeEach(async () => {
    cleared = {
      ...tenant(),
      sanityReadTokenEncrypted: null,
      sanityWriteTokenEncrypted: null,
      sanityManagementTokenEncrypted: null,
      sanityManagementRobotId: null,
      provisioningStatus: null,
      provisioningSteps: null,
      seededAt: null,
      updatedAt: MOCK_NOW,
    };
    await clearTenantProvisioningArtifacts(tenant().id);
  });

  it('nulls every provisioning column but keeps the archived Sanity project', async () => {
    const rows = await db().select().from(schema.tenants);
    expect(rows).toEqual([cleared]);
  });

  it('is safe to call again once already cleared', async () => {
    await clearTenantProvisioningArtifacts(tenant().id);

    const rows = await db().select().from(schema.tenants);
    expect(rows).toEqual([cleared]);
  });
});
