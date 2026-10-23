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
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  daysAfterLastActivity,
  MOCK_LAST_ACTIVITY_AT,
} from '@blog/db/testing/tenants/inactivity';

import { listTenantsDueForInactivityStage } from './list-tenants-due-for-inactivity-stage';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const DAY_23 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.SUSPENSION_WARNING);
const DAY_22 = daysAfterLastActivity(
  INACTIVITY_STAGE_DAY.SUSPENSION_WARNING - 1,
);
const DAY_30 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.SUSPENSION);
const DAY_50 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.DELETION_NOTICE);
const DAY_60 = daysAfterLastActivity(INACTIVITY_STAGE_DAY.DEPROVISIONING);

const STAMPED_STAGES: [TStampedInactivityStage, Date][] = [
  [INACTIVITY_STAGE.SUSPENSION_WARNING, DAY_23],
  [INACTIVITY_STAGE.SUSPENSION, DAY_30],
  [INACTIVITY_STAGE.DELETION_NOTICE, DAY_50],
];

async function dueIds(stage: TInactivityStage, now: Date) {
  const due = await listTenantsDueForInactivityStage(stage, now);
  return due.map((tenant) => tenant.id);
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsDueForInactivityStage, () => {
  it('returns a tenant once at each of day 23, 30, 50 and 60', async () => {
    const tenant = await insertTestTenant(db(), {
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
    });

    for (const [stage, now] of STAMPED_STAGES) {
      expect(await dueIds(stage, now)).toEqual([tenant.id]);
      await stampTenantInactivityStage(tenant.id, stage, now);
      expect(await dueIds(stage, now)).toEqual([]);
    }

    expect(await dueIds(INACTIVITY_STAGE.DEPROVISIONING, DAY_60)).toEqual([
      tenant.id,
    ]);
    await startDeprovisioningRun({ tenantId: tenant.id });
    expect(await dueIds(INACTIVITY_STAGE.DEPROVISIONING, DAY_60)).toEqual([]);
  });

  it('returns nothing before day 23', async () => {
    await insertTestTenant(db(), { lastActivityAt: MOCK_LAST_ACTIVITY_AT });

    expect(await dueIds(INACTIVITY_STAGE.SUSPENSION_WARNING, DAY_22)).toEqual(
      [],
    );
  });

  it('never returns an archived tenant', async () => {
    await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: DAY_22,
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
    });

    for (const stage of Object.values(INACTIVITY_STAGE)) {
      expect(await dueIds(stage, DAY_60)).toEqual([]);
    }
  });
});
