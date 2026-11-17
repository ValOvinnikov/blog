import {
  SELLABLE_TENANT_PLANS,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import {
  INACTIVITY_STAGE,
  INACTIVITY_STAGE_DAY,
  SUSPENSION_REASON,
  WRITABLE_TENANT_STATUSES,
  TENANT_STATUS,
  type TInactivityStage,
  type TStampedInactivityStage,
} from '@shinefold/db/constants';
import { stampTenantInactivityStage } from '@shinefold/db/queries/tenants/stamp-tenant-inactivity-stage';
import { startDeprovisioningRun } from '@shinefold/db/queries/tenants/start-deprovisioning-run';
import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { mockStripeIds } from '@shinefold/db/testing/tenants/billing';
import {
  daysAfterLastActivity,
  MOCK_LAST_ACTIVITY_AT,
} from '@shinefold/db/testing/tenants/inactivity';

import { listTenantsDueForInactivityStage } from './list-tenants-due-for-inactivity-stage';

vi.mock('@shinefold/db/client');

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

const MOCK_STAGE_DAY: Record<TInactivityStage, Date> = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: MOCK_DAY_23,
  [INACTIVITY_STAGE.SUSPENSION]: MOCK_DAY_30,
  [INACTIVITY_STAGE.DELETION_NOTICE]: MOCK_DAY_50,
  [INACTIVITY_STAGE.DEPROVISIONING]: MOCK_DAY_60,
};

const MOCK_SUSPENDED_FOR_INACTIVITY = {
  status: TENANT_STATUS.SUSPENDED,
  suspensionReason: SUSPENSION_REASON.INACTIVITY,
  inactivityWarnedAt: MOCK_DAY_23,
  suspendedAt: MOCK_DAY_30,
};

const MOCK_STAGE_STATE: Record<
  TInactivityStage,
  Partial<typeof schema.tenants.$inferInsert>
> = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: {},
  [INACTIVITY_STAGE.SUSPENSION]: { inactivityWarnedAt: MOCK_DAY_23 },
  [INACTIVITY_STAGE.DELETION_NOTICE]: MOCK_SUSPENDED_FOR_INACTIVITY,
  [INACTIVITY_STAGE.DEPROVISIONING]: {
    ...MOCK_SUSPENDED_FOR_INACTIVITY,
    deletionNotifiedAt: MOCK_DAY_50,
  },
};

const MOCK_STAGES = Object.values(INACTIVITY_STAGE);

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

  it.each(WRITABLE_TENANT_STATUSES)(
    'returns a %s tenant at the suspension warning stage',
    async (status) => {
      const tenant = await insertTestTenant(db(), {
        status,
        lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      });

      const due = await dueIds(
        INACTIVITY_STAGE.SUSPENSION_WARNING,
        MOCK_DAY_23,
      );

      expect(due).toEqual([tenant.id]);
    },
  );

  it.each(
    SELLABLE_TENANT_PLANS.flatMap((plan) =>
      MOCK_STAGES.map((stage) => [plan, stage] as const),
    ),
  )(
    'never returns a subscribed %s tenant at the %s stage',
    async (plan, stage) => {
      await insertTestTenant(db(), {
        plan,
        stripeSubscriptionId: mockStripeIds().stripeSubscriptionId,
        lastActivityAt: MOCK_LAST_ACTIVITY_AT,
        ...MOCK_STAGE_STATE[stage],
      });

      const due = await dueIds(stage, MOCK_STAGE_DAY[stage]);

      expect(due).toEqual([]);
    },
  );

  it.each(MOCK_STAGES)(
    'returns a trial tenant with no subscription at the %s stage',
    async (stage) => {
      const tenant = await insertTestTenant(db(), {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.TRIAL,
        lastActivityAt: MOCK_LAST_ACTIVITY_AT,
        ...MOCK_STAGE_STATE[stage],
      });

      const due = await dueIds(stage, MOCK_STAGE_DAY[stage]);

      expect(due).toEqual([tenant.id]);
    },
  );

  it.each(MOCK_STAGES)(
    'returns a Free tenant whose subscription was cancelled at the %s stage',
    async (stage) => {
      const tenant = await insertTestTenant(db(), {
        plan: TENANT_PLAN.FREE,
        stripeSubscriptionId: mockStripeIds().stripeSubscriptionId,
        lastActivityAt: MOCK_LAST_ACTIVITY_AT,
        ...MOCK_STAGE_STATE[stage],
      });

      const due = await dueIds(stage, MOCK_STAGE_DAY[stage]);

      expect(due).toEqual([tenant.id]);
    },
  );

  it.each(MOCK_STAGES)(
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
