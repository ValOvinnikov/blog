import {
  TENANT_PLAN,
  TENANT_PLAN_WRITE_OUTCOME,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { graceStartedDaysAgo } from '@blog/db/testing/tenants/grace';
import {
  MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
  readSelfServeIndex,
} from '@blog/db/testing/tenants/self-serve-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantPlan } from './set-tenant-plan';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.tenants);
});

async function readGraceStart(tenantId: string) {
  const [row] = await db()
    .select({ startedAt: tenants.downgradeGraceStartedAt })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row?.startedAt;
}

describe(setTenantPlan, () => {
  describe('the downgrade grace', () => {
    it.each([
      ['a paid plan', TENANT_PLAN.STARTER, TENANT_STATUS.ACTIVE],
      ['a trial', TENANT_PLAN.GROWTH, TENANT_STATUS.TRIAL],
    ])('starts when a site leaves %s for Free', async (_, plan, status) => {
      const { id } = await insertTestTenant(db(), { plan, status });

      await setTenantPlan(id, {
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(await readGraceStart(id)).toEqual(MOCK_NOW);
    });

    it('keeps running when a Free site is written Free again', async () => {
      const startedAt = graceStartedDaysAgo(3);
      const { id } = await insertTestTenant(db(), {
        downgradeGraceStartedAt: startedAt,
      });

      await setTenantPlan(id, {
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(await readGraceStart(id)).toEqual(startedAt);
    });

    it('ends when the site moves to a paid plan', async () => {
      const { id } = await insertTestTenant(db(), {
        downgradeGraceStartedAt: graceStartedDaysAgo(3),
      });

      await setTenantPlan(id, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(await readGraceStart(id)).toBeNull();
    });
  });

  describe('a self-serve Free tenant', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        plan: TENANT_PLAN.FREE,
        selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      }));
    });

    it('writes a paid plan and status and clears the Free-site key', async () => {
      const result = await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.PAST_DUE,
      });

      expect(result).toEqual({
        outcome: TENANT_PLAN_WRITE_OUTCOME.WRITTEN,
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.PAST_DUE,
        previousPlan: TENANT_PLAN.FREE,
      });
      expect(await readSelfServeIndex(db(), tenantId)).toBeNull();
    });

    it('reports the stored plan as the previous one when a write repeats it', async () => {
      const write = {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.ACTIVE,
      };
      await setTenantPlan(tenantId, write);

      const repeated = await setTenantPlan(tenantId, write);

      expect(repeated).toMatchObject({ previousPlan: TENANT_PLAN.GROWTH });
    });

    it('keeps the Free-site key on a write that stays on FREE', async () => {
      await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(await readSelfServeIndex(db(), tenantId)).toBe(
        MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      );
    });

    it('moves back to FREE after a paid plan while the owner holds another Free site', async () => {
      await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.STARTER,
        status: TENANT_STATUS.ACTIVE,
      });
      await insertTestTenant(db(), {
        selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      });

      const result = await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(result).toEqual({
        outcome: TENANT_PLAN_WRITE_OUTCOME.WRITTEN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        previousPlan: TENANT_PLAN.STARTER,
      });
    });
  });

  describe('a self-serve trial', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.TRIAL,
        selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      }));
    });

    it('keeps the Free-or-trial key while it stays in TRIAL', async () => {
      await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.TRIAL,
      });

      expect(await readSelfServeIndex(db(), tenantId)).toBe(
        MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      );
    });

    it('clears the key when it converts to a paid, running site', async () => {
      await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(await readSelfServeIndex(db(), tenantId)).toBeNull();
    });
  });

  it.each([TENANT_STATUS.ARCHIVED, TENANT_STATUS.SUSPENDED])(
    'leaves a %s tenant unchanged and reports it not writable',
    async (status) => {
      const { id } = await insertTestTenant(db(), {
        plan: TENANT_PLAN.FREE,
        status,
      });

      const result = await setTenantPlan(id, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(result).toEqual({
        outcome: TENANT_PLAN_WRITE_OUTCOME.NOT_WRITABLE,
        status,
      });
      const [row] = await db()
        .select({ plan: tenants.plan, status: tenants.status })
        .from(tenants)
        .where(eq(tenants.id, id));
      expect(row).toEqual({ plan: TENANT_PLAN.FREE, status });
    },
  );

  it('reports not-found for a tenant id that does not exist', async () => {
    const result = await setTenantPlan(MOCK_MISSING_TENANT_ID, {
      plan: TENANT_PLAN.GROWTH,
      status: TENANT_STATUS.ACTIVE,
    });

    expect(result).toEqual({ outcome: TENANT_PLAN_WRITE_OUTCOME.NOT_FOUND });
  });
});
