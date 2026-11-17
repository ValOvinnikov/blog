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
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { claimTakeawayGeneration } from './claim-takeaway-generation';

vi.mock('@shinefold/db/client');

const FREE_ALLOWANCE = PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].takeawaysPerMonth;
const DAYS_TO_NEXT_MONTH = 31;

const db = useQueryTestDb();
const tenant = useTestTenant(db);
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
    const claim = await claimTakeawayGeneration(tenantId, TENANT_PLAN.FREE);

    expect(claim).toEqual({ tenantId, month: MOCK_THIS_MONTH });
    expect(await readTakeawayGenerationCounts(db())).toEqual([
      { tenantId, month: MOCK_THIS_MONTH, count: 1 },
    ]);
  });

  it('grants exactly one of two claims racing for the last generation', async () => {
    await insertTestTakeawayGenerationCount(db(), tenantId, FREE_ALLOWANCE - 1);

    const claims = await Promise.all([
      claimTakeawayGeneration(tenantId, TENANT_PLAN.FREE),
      claimTakeawayGeneration(tenantId, TENANT_PLAN.FREE),
    ]);

    expect(claims.filter(Boolean)).toHaveLength(1);
    const [row] = await readTakeawayGenerationCounts(db());
    expect(row?.count).toBe(FREE_ALLOWANCE);
  });

  describe('once the Free allowance is used', () => {
    beforeEach(async () => {
      await insertTestTakeawayGenerationCount(db(), tenantId, FREE_ALLOWANCE);
    });

    it('refuses a Free claim, leaving the count alone', async () => {
      const claim = await claimTakeawayGeneration(tenantId, TENANT_PLAN.FREE);

      expect(claim).toBeNull();
      const [row] = await readTakeawayGenerationCounts(db());
      expect(row?.count).toBe(FREE_ALLOWANCE);
    });

    it('allows a larger plan past the smaller allowance', async () => {
      const claim = await claimTakeawayGeneration(tenantId, TENANT_PLAN.GROWTH);

      expect(claim).not.toBeNull();
    });

    it('starts a fresh allowance in the next calendar month', async () => {
      vi.setSystemTime(MOCK_NOW.getTime() + DAYS_TO_NEXT_MONTH * DAY_MS);

      const claim = await claimTakeawayGeneration(tenantId, TENANT_PLAN.FREE);

      expect(claim).not.toBeNull();
      expect(claim?.month).not.toBe(MOCK_THIS_MONTH);
    });

    it("keeps another tenant's allowance apart", async () => {
      const { id: otherTenantId } = await insertTestTenant(db());

      const claim = await claimTakeawayGeneration(
        otherTenantId,
        TENANT_PLAN.FREE,
      );

      expect(claim).toEqual({
        tenantId: otherTenantId,
        month: MOCK_THIS_MONTH,
      });
    });
  });
});
