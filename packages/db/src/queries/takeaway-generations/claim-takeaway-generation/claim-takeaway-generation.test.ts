import { TENANT_PLAN } from '@shinefold/config/constants';
import { DAY_MS, PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestTakeawayGenerationCount,
  MOCK_THIS_MONTH,
  readTakeawayGenerationCounts,
} from '@shinefold/db/testing/takeaway-generations/fixtures';
import {
  patchTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { claimTakeawayGeneration } from './claim-takeaway-generation';

vi.mock('@shinefold/db/client');

const FREE_ALLOWANCE = PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].takeawaysPerMonth;
const GROWTH_ALLOWANCE =
  PLAN_ENTITLEMENTS[TENANT_PLAN.GROWTH].takeawaysPerMonth;
const DAYS_TO_NEXT_MONTH = 31;

const db = useQueryTestDb();
const tenant = useTestTenant(db, { plan: TENANT_PLAN.FREE });
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.takeawayGenerationCounts);
});

describe(claimTakeawayGeneration, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('claims a generation for this month and counts it', async () => {
    const claim = await claimTakeawayGeneration(tenantId);

    expect(claim).toEqual({ tenantId, month: MOCK_THIS_MONTH });
    expect(await readTakeawayGenerationCounts(db())).toEqual([
      { tenantId, month: MOCK_THIS_MONTH, count: 1 },
    ]);
  });

  it('grants exactly one of two claims racing for the last generation', async () => {
    await insertTestTakeawayGenerationCount(db(), tenantId, FREE_ALLOWANCE - 1);

    const claims = await Promise.all([
      claimTakeawayGeneration(tenantId),
      claimTakeawayGeneration(tenantId),
    ]);

    expect(claims.filter(Boolean)).toHaveLength(1);
    const [row] = await readTakeawayGenerationCounts(db());
    expect(row?.count).toBe(FREE_ALLOWANCE);
  });

  describe('once the Free allowance is used', () => {
    beforeEach(async () => {
      await insertTestTakeawayGenerationCount(db(), tenantId, FREE_ALLOWANCE);
    });

    it('refuses the claim, leaving the count alone', async () => {
      const claim = await claimTakeawayGeneration(tenantId);

      expect(claim).toBeNull();
      const [row] = await readTakeawayGenerationCounts(db());
      expect(row?.count).toBe(FREE_ALLOWANCE);
    });

    it('allows the next claim as soon as the tenant upgrades', async () => {
      await patchTestTenant(db(), tenantId, { plan: TENANT_PLAN.GROWTH });

      const claim = await claimTakeawayGeneration(tenantId);

      expect(claim).not.toBeNull();
    });

    it('starts a fresh allowance in the next calendar month', async () => {
      vi.setSystemTime(MOCK_NOW.getTime() + DAYS_TO_NEXT_MONTH * DAY_MS);

      const claim = await claimTakeawayGeneration(tenantId);

      expect(claim).not.toBeNull();
      expect(claim?.month).not.toBe(MOCK_THIS_MONTH);
    });

    it("keeps another tenant's allowance apart", async () => {
      const { id: otherTenantId } = await insertTestTenant(db(), {
        plan: TENANT_PLAN.FREE,
      });

      const claim = await claimTakeawayGeneration(otherTenantId);

      expect(claim).toEqual({
        tenantId: otherTenantId,
        month: MOCK_THIS_MONTH,
      });
    });
  });

  describe('on Growth', () => {
    beforeEach(async () => {
      await patchTestTenant(db(), tenantId, { plan: TENANT_PLAN.GROWTH });
    });

    it('refuses the next claim as soon as the tenant downgrades', async () => {
      await insertTestTakeawayGenerationCount(db(), tenantId, FREE_ALLOWANCE);
      await patchTestTenant(db(), tenantId, { plan: TENANT_PLAN.FREE });

      const claim = await claimTakeawayGeneration(tenantId);

      expect(claim).toBeNull();
    });

    it('refuses once the Growth allowance is used', async () => {
      await insertTestTakeawayGenerationCount(db(), tenantId, GROWTH_ALLOWANCE);

      const claim = await claimTakeawayGeneration(tenantId);

      expect(claim).toBeNull();
    });
  });
});
