import {
  INACTIVITY_STAGE,
  INACTIVITY_STAGE_DAY,
  TENANT_STATUS,
  type TInactivityStage,
  type TStampedInactivityStage,
} from '@blog/db/constants';
import { stampTenantInactivityStage } from '@blog/db/queries/tenants/stamp-tenant-inactivity-stage';
import { startDeprovisioningRun } from '@blog/db/queries/tenants/start-deprovisioning-run';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  daysAfterLastActivity,
  MOCK_LAST_ACTIVITY_AT,
} from '@blog/db/testing/tenants/inactivity';

import { listTenantsDueForInactivityStage } from './list-tenants-due-for-inactivity-stage';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_DAY_23 = daysAfterLastActivity(
  INACTIVITY_STAGE_DAY.SUSPENSION_WARNING,
);
const MOCK_DAY_22 = daysAfterLastActivity(
  INACTIVITY_STAGE_DAY.SUSPENSION_WARNING - 1,
);
const MOCK_DAY_30 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.SUSPENSION);
const MOCK_DAY_50 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.DELETION_NOTICE);
const MOCK_DAY_60 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.DEPROVISIONING);

const MOCK_STAMPED_STAGES: [TStampedInactivityStage, Date][] = [
  [INACTIVITY_STAGE.SUSPENSION_WARNING, MOCK_DAY_23],
  [INACTIVITY_STAGE.SUSPENSION, MOCK_DAY_30],
  [INACTIVITY_STAGE.DELETION_NOTICE, MOCK_DAY_50],
];

async function dueIds(stage: TInactivityStage, now: Date) {
  const due = await listTenantsDueForInactivityStage(stage, now);
  return due.map((tenant) => tenant.id);
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsDueForInactivityStage, () => {
  describe('a tenant last active at the reference time', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db(), {
        lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      });
    });

    it('returns the tenant once at each of day 23, 30, 50 and 60', async () => {
      const dueBeforeAndAfter: string[][] = [];
      for (const [stage, now] of MOCK_STAMPED_STAGES) {
        dueBeforeAndAfter.push(await dueIds(stage, now));
        await stampTenantInactivityStage(tenant.id, stage, now);
        dueBeforeAndAfter.push(await dueIds(stage, now));
      }
      dueBeforeAndAfter.push(
        await dueIds(INACTIVITY_STAGE.DEPROVISIONING, MOCK_DAY_60),
      );
      await startDeprovisioningRun({ tenantId: tenant.id });
      dueBeforeAndAfter.push(
        await dueIds(INACTIVITY_STAGE.DEPROVISIONING, MOCK_DAY_60),
      );

      expect(dueBeforeAndAfter).toEqual([
        [tenant.id],
        [],
        [tenant.id],
        [],
        [tenant.id],
        [],
        [tenant.id],
        [],
      ]);
    });

    it('returns nothing before day 23', async () => {
      const due = await listTenantsDueForInactivityStage(
        INACTIVITY_STAGE.SUSPENSION_WARNING,
        MOCK_DAY_22,
      );

      expect(due).toEqual([]);
    });
  });

  it.each(Object.values(INACTIVITY_STAGE))(
    'never returns an archived tenant at the %s stage',
    async (stage) => {
      await insertTestTenant(db(), {
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: MOCK_DAY_22,
        lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      });

      const due = await listTenantsDueForInactivityStage(stage, MOCK_DAY_60);

      expect(due).toEqual([]);
    },
  );
});
