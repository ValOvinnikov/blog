import {
  INACTIVITY_STAGE,
  INACTIVITY_STAGE_DAY,
  SUSPENSION_REASON,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  daysAfterLastActivity,
  MOCK_LAST_ACTIVITY_AT,
} from '@blog/db/testing/tenants/inactivity';

import { stampTenantInactivityStage } from './stamp-tenant-inactivity-stage';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

const MOCK_DAY_23 = daysAfterLastActivity(
  INACTIVITY_STAGE_DAY.SUSPENSION_WARNING,
);
const MOCK_DAY_30 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.SUSPENSION);
const MOCK_DAY_50 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.DELETION_NOTICE);

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(stampTenantInactivityStage, () => {
  describe('a tenant last active at the reference time', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db(), {
        lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      });
    });

    it('stamps the warning once', async () => {
      const first = await stampTenantInactivityStage(
        tenant.id,
        INACTIVITY_STAGE.SUSPENSION_WARNING,
        MOCK_DAY_23,
      );
      const second = await stampTenantInactivityStage(
        tenant.id,
        INACTIVITY_STAGE.SUSPENSION_WARNING,
        MOCK_DAY_23,
      );

      expect(first).toEqual({
        ...tenant,
        inactivityWarnedAt: MOCK_DAY_23,
        updatedAt: MOCK_NOW,
      });
      expect(second).toBeNull();
    });

    it('refuses a stage the tenant is not yet due for', async () => {
      const stamped = await stampTenantInactivityStage(
        tenant.id,
        INACTIVITY_STAGE.SUSPENSION,
        MOCK_DAY_30,
      );

      expect(stamped).toBeNull();
    });
  });

  it('suspends a warned tenant for inactivity', async () => {
    const tenant = await insertTestTenant(db(), {
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      inactivityWarnedAt: MOCK_DAY_23,
    });

    const stamped = await stampTenantInactivityStage(
      tenant.id,
      INACTIVITY_STAGE.SUSPENSION,
      MOCK_DAY_30,
    );

    expect(stamped).toEqual({
      ...tenant,
      status: TENANT_STATUS.SUSPENDED,
      suspendedAt: MOCK_DAY_30,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
      updatedAt: MOCK_NOW,
    });
  });

  it('never sends the deletion notice to a tenant an operator suspended', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      suspendedAt: MOCK_DAY_30,
      suspensionReason: SUSPENSION_REASON.OPERATOR,
    });

    const stamped = await stampTenantInactivityStage(
      tenant.id,
      INACTIVITY_STAGE.DELETION_NOTICE,
      MOCK_DAY_50,
    );

    expect(stamped).toBeNull();
  });
});
