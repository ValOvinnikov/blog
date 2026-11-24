import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN_WRITE_OUTCOME,
  TENANT_STATUS,
} from '@shinefold/db/constants';
import { lockMembershipsOverSeats } from '@shinefold/db/queries/memberships/lock-memberships-over-seats';
import { endDowngradeGrace } from '@shinefold/db/queries/tenants/end-downgrade-grace';
import * as schema from '@shinefold/db/schema';
import { memberships } from '@shinefold/db/schema/memberships';
import { tenants } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { mockMembershipInvite } from '@shinefold/db/testing/membership-invites/fixtures';
import {
  countLockedMemberships,
  insertTeam,
} from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import { daysBeforeNow } from '@shinefold/db/testing/tenants/grace';
import {
  MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
  readSelfServeIndex,
} from '@shinefold/db/testing/tenants/self-serve-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantPlan } from './set-tenant-plan';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.memberships);
  await db().delete(schema.users);
  await db().delete(schema.tenants);
});

async function readGrace(tenantId: string) {
  const [row] = await db()
    .select({
      startedAt: tenants.downgradeGraceStartedAt,
      fromPlan: tenants.downgradedFromPlan,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row;
}

async function readGraceStart(tenantId: string) {
  return (await readGrace(tenantId))?.startedAt;
}

const MOCK_MOVE_TO_FREE = {
  plan: TENANT_PLAN.FREE,
  status: TENANT_STATUS.ACTIVE,
};
const MOCK_MOVE_TO_STARTER = {
  plan: TENANT_PLAN.STARTER,
  status: TENANT_STATUS.ACTIVE,
};
const MOCK_MOVE_TO_GROWTH = {
  plan: TENANT_PLAN.GROWTH,
  status: TENANT_STATUS.ACTIVE,
};

describe(setTenantPlan, () => {
  describe('a site with members locked on Free', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db()));
      await insertTeam(db(), tenantId, [
        MEMBERSHIP_ROLE.OWNER,
        MEMBERSHIP_ROLE.EDITOR,
      ]);
      await lockMembershipsOverSeats(tenantId, TENANT_PLAN.FREE, MOCK_NOW);
    });

    it('gets its members back when it moves to a paid plan', async () => {
      await setTenantPlan(tenantId, MOCK_MOVE_TO_GROWTH);

      await expect(countLockedMemberships(db())).resolves.toBe(0);
    });

    it('keeps them locked when the plan write is refused', async () => {
      await db()
        .update(tenants)
        .set({ status: TENANT_STATUS.SUSPENDED })
        .where(eq(tenants.id, tenantId));

      await setTenantPlan(tenantId, MOCK_MOVE_TO_GROWTH);

      await expect(countLockedMemberships(db())).resolves.toBe(1);
    });
  });

  describe('the downgrade grace', () => {
    it.each([
      ['a paid plan', TENANT_PLAN.STARTER, TENANT_STATUS.ACTIVE],
      ['a trial', TENANT_PLAN.GROWTH, TENANT_STATUS.TRIAL],
    ])('starts when a site leaves %s for Free', async (_, plan, status) => {
      const { id } = await insertTestTenant(db(), { plan, status });

      await setTenantPlan(id, MOCK_MOVE_TO_FREE);

      expect(await readGraceStart(id)).toEqual(MOCK_NOW);
    });

    it('records the plan a site left for Free', async () => {
      const { id } = await insertTestTenant(db(), {
        plan: TENANT_PLAN.STARTER,
      });

      await setTenantPlan(id, MOCK_MOVE_TO_FREE);

      expect((await readGrace(id))?.fromPlan).toBe(TENANT_PLAN.STARTER);
    });

    it('keeps running when a Free site is written Free again', async () => {
      const startedAt = daysBeforeNow(3);
      const { id } = await insertTestTenant(db(), {
        downgradeGraceStartedAt: startedAt,
      });

      await setTenantPlan(id, MOCK_MOVE_TO_FREE);

      expect(await readGraceStart(id)).toEqual(startedAt);
    });

    it('ends when the site moves to a paid plan', async () => {
      const { id } = await insertTestTenant(db(), {
        downgradeGraceStartedAt: daysBeforeNow(3),
      });

      await setTenantPlan(id, MOCK_MOVE_TO_GROWTH);

      expect(await readGraceStart(id)).toBeNull();
    });
  });

  describe('a Growth site moving to Starter', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), MOCK_MOVE_TO_GROWTH));
      await insertTeam(db(), tenantId, [MEMBERSHIP_ROLE.OWNER]);
    });

    it('starts the grace and records Growth when its members exceed the seats', async () => {
      await insertTeam(db(), tenantId, [MEMBERSHIP_ROLE.EDITOR]);

      await setTenantPlan(tenantId, MOCK_MOVE_TO_STARTER);

      expect(await readGrace(tenantId)).toEqual({
        startedAt: MOCK_NOW,
        fromPlan: TENANT_PLAN.GROWTH,
      });
    });

    it('counts a pending invite as a seat', async () => {
      await mockMembershipInvite(db(), tenantId, {
        role: MEMBERSHIP_ROLE.EDITOR,
      });

      await setTenantPlan(tenantId, MOCK_MOVE_TO_STARTER);

      expect(await readGraceStart(tenantId)).toEqual(MOCK_NOW);
    });

    it('starts no grace when the site fits the seats', async () => {
      await setTenantPlan(tenantId, MOCK_MOVE_TO_STARTER);

      expect(await readGraceStart(tenantId)).toBeNull();
    });
  });

  describe('a Starter site in its grace', () => {
    const startedAt = daysBeforeNow(3);
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        ...MOCK_MOVE_TO_STARTER,
        downgradeGraceStartedAt: startedAt,
        downgradedFromPlan: TENANT_PLAN.GROWTH,
      }));
      await insertTeam(db(), tenantId, [
        MEMBERSHIP_ROLE.OWNER,
        MEMBERSHIP_ROLE.EDITOR,
      ]);
    });

    it('keeps it when written Starter again while over the seats', async () => {
      await setTenantPlan(tenantId, MOCK_MOVE_TO_STARTER);

      expect(await readGraceStart(tenantId)).toEqual(startedAt);
    });

    it('keeps its deadline and the plan it left when it moves to Free', async () => {
      await setTenantPlan(tenantId, MOCK_MOVE_TO_FREE);

      expect(await readGrace(tenantId)).toEqual({
        startedAt,
        fromPlan: TENANT_PLAN.GROWTH,
      });
    });

    it('ends it once the site fits its seats', async () => {
      await db()
        .delete(memberships)
        .where(eq(memberships.role, MEMBERSHIP_ROLE.EDITOR));

      await setTenantPlan(tenantId, MOCK_MOVE_TO_STARTER);

      expect(await readGraceStart(tenantId)).toBeNull();
    });

    it('ends it when the site moves back up', async () => {
      await setTenantPlan(tenantId, MOCK_MOVE_TO_GROWTH);

      expect(await readGrace(tenantId)).toEqual({
        startedAt: null,
        fromPlan: null,
      });
    });
  });

  describe('a Free site in its grace paying for Starter while over its seats', () => {
    const startedAt = daysBeforeNow(14);
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        downgradeGraceStartedAt: startedAt,
        downgradedFromPlan: TENANT_PLAN.GROWTH,
      }));
      await insertTeam(db(), tenantId, [
        MEMBERSHIP_ROLE.OWNER,
        MEMBERSHIP_ROLE.EDITOR,
        MEMBERSHIP_ROLE.EDITOR,
      ]);
      await setTenantPlan(tenantId, MOCK_MOVE_TO_STARTER);
    });

    it('keeps the grace, its deadline and the plan it left', async () => {
      expect(await readGrace(tenantId)).toEqual({
        startedAt,
        fromPlan: TENANT_PLAN.GROWTH,
      });
    });

    it("locks on day 14 only the members over Starter's seats", async () => {
      const ended = await endDowngradeGrace(tenantId, startedAt);
      if (!ended) throw new Error('the grace did not end');

      await expect(
        lockMembershipsOverSeats(tenantId, ended.plan, MOCK_NOW),
      ).resolves.toBe(2);
      expect(ended.plan).toBe(TENANT_PLAN.STARTER);
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
      await setTenantPlan(tenantId, MOCK_MOVE_TO_GROWTH);

      const repeated = await setTenantPlan(tenantId, MOCK_MOVE_TO_GROWTH);

      expect(repeated).toMatchObject({ previousPlan: TENANT_PLAN.GROWTH });
    });

    it('keeps the Free-site key on a write that stays on FREE', async () => {
      await setTenantPlan(tenantId, MOCK_MOVE_TO_FREE);

      expect(await readSelfServeIndex(db(), tenantId)).toBe(
        MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      );
    });

    it('moves back to FREE after a paid plan while the owner holds another Free site', async () => {
      await setTenantPlan(tenantId, MOCK_MOVE_TO_STARTER);
      await insertTestTenant(db(), {
        selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      });

      const result = await setTenantPlan(tenantId, MOCK_MOVE_TO_FREE);

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
      await setTenantPlan(tenantId, MOCK_MOVE_TO_GROWTH);

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

      const result = await setTenantPlan(id, MOCK_MOVE_TO_GROWTH);

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
    const result = await setTenantPlan(
      MOCK_MISSING_TENANT_ID,
      MOCK_MOVE_TO_GROWTH,
    );

    expect(result).toEqual({ outcome: TENANT_PLAN_WRITE_OUTCOME.NOT_FOUND });
  });
});
