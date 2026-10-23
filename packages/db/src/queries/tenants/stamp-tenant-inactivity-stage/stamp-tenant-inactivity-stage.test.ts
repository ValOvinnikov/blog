import {
  INACTIVITY_STAGE,
  INACTIVITY_STAGE_DAY,
  SUSPENSION_REASON,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  daysAfterLastActivity,
  MOCK_LAST_ACTIVITY_AT,
} from '@blog/db/testing/tenants/inactivity';

import { stampTenantInactivityStage } from './stamp-tenant-inactivity-stage';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const DAY_23 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.SUSPENSION_WARNING);
const DAY_30 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.SUSPENSION);
const DAY_50 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.DELETION_NOTICE);

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(stampTenantInactivityStage, () => {
  it('stamps the warning once', async () => {
    const tenant = await insertTestTenant(db(), {
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
    });

    const first = await stampTenantInactivityStage(
      tenant.id,
      INACTIVITY_STAGE.SUSPENSION_WARNING,
      DAY_23,
    );
    const second = await stampTenantInactivityStage(
      tenant.id,
      INACTIVITY_STAGE.SUSPENSION_WARNING,
      DAY_23,
    );

    expect(first?.inactivityWarnedAt).toEqual(DAY_23);
    expect(second).toBeNull();
  });

  it('suspends a warned tenant for inactivity', async () => {
    const tenant = await insertTestTenant(db(), {
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      inactivityWarnedAt: DAY_23,
    });

    const stamped = await stampTenantInactivityStage(
      tenant.id,
      INACTIVITY_STAGE.SUSPENSION,
      DAY_30,
    );

    expect(stamped?.status).toBe(TENANT_STATUS.SUSPENDED);
    expect(stamped?.suspendedAt).toEqual(DAY_30);
    expect(stamped?.suspensionReason).toBe(SUSPENSION_REASON.INACTIVITY);
  });

  it('refuses a stage the tenant is not yet due for', async () => {
    const tenant = await insertTestTenant(db(), {
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
    });

    const stamped = await stampTenantInactivityStage(
      tenant.id,
      INACTIVITY_STAGE.SUSPENSION,
      DAY_30,
    );

    expect(stamped).toBeNull();
  });

  it('never sends the deletion notice to a tenant an operator suspended', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      suspendedAt: DAY_30,
      suspensionReason: SUSPENSION_REASON.OPERATOR,
    });

    const stamped = await stampTenantInactivityStage(
      tenant.id,
      INACTIVITY_STAGE.DELETION_NOTICE,
      DAY_50,
    );

    expect(stamped).toBeNull();
  });
});
