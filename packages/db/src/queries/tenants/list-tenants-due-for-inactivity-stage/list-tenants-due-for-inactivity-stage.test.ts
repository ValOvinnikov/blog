import {
  INACTIVITY_STAGE,
  TENANT_STATUS,
  type TInactivityStage,
  type TStampedInactivityStage,
} from '@blog/db/constants';
import { stampTenantInactivityStage } from '@blog/db/queries/tenants/stamp-tenant-inactivity-stage';
import { startDeprovisioningRun } from '@blog/db/queries/tenants/start-deprovisioning-run';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listTenantsDueForInactivityStage } from './list-tenants-due-for-inactivity-stage';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const LAST_ACTIVITY_AT = new Date('2026-01-01T00:00:00.000Z');
const DAY_22 = new Date('2026-01-23T00:00:00.000Z');
const DAY_23 = new Date('2026-01-24T00:00:00.000Z');
const DAY_30 = new Date('2026-01-31T00:00:00.000Z');
const DAY_50 = new Date('2026-02-20T00:00:00.000Z');
const DAY_60 = new Date('2026-03-02T00:00:00.000Z');

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
      lastActivityAt: LAST_ACTIVITY_AT,
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
    await insertTestTenant(db(), { lastActivityAt: LAST_ACTIVITY_AT });

    expect(await dueIds(INACTIVITY_STAGE.SUSPENSION_WARNING, DAY_22)).toEqual(
      [],
    );
  });

  it('never returns an archived tenant', async () => {
    await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: DAY_22,
      lastActivityAt: LAST_ACTIVITY_AT,
    });

    for (const stage of Object.values(INACTIVITY_STAGE)) {
      expect(await dueIds(stage, DAY_60)).toEqual([]);
    }
  });
});
