import { claimTakeawayGeneration } from '@shinefold/db/queries/takeaway-generations/claim-takeaway-generation';
import * as schema from '@shinefold/db/schema';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestTakeawayGenerationCount,
  MOCK_LAST_MONTH,
} from '@shinefold/db/testing/takeaway-generations/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { countTakeawayGenerationsThisMonth } from './count-takeaway-generations-this-month';

vi.mock('@shinefold/db/client');

const MOCK_USED_COUNT = 3;
const LAST_INSTANT_OF_MONTH = new Date('2026-10-31T23:59:59.999Z');
const FIRST_INSTANT_OF_NEXT_MONTH = new Date('2026-11-01T00:00:00.000Z');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.takeawayGenerationCounts);
});

describe(countTakeawayGenerationsThisMonth, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('reads zero for a site with no generations', async () => {
    expect(await countTakeawayGenerationsThisMonth(tenantId)).toBe(0);
  });

  it("reads this month's generations", async () => {
    await insertTestTakeawayGenerationCount(db(), tenantId, MOCK_USED_COUNT);

    expect(await countTakeawayGenerationsThisMonth(tenantId)).toBe(
      MOCK_USED_COUNT,
    );
  });

  it("reads zero when the only generations are last month's", async () => {
    await insertTestTakeawayGenerationCount(
      db(),
      tenantId,
      MOCK_USED_COUNT,
      MOCK_LAST_MONTH,
    );

    expect(await countTakeawayGenerationsThisMonth(tenantId)).toBe(0);
  });

  it('counts a claim until the month the claim used ends', async () => {
    await claimTakeawayGeneration(tenantId);

    vi.setSystemTime(LAST_INSTANT_OF_MONTH);
    expect(await countTakeawayGenerationsThisMonth(tenantId)).toBe(1);

    vi.setSystemTime(FIRST_INSTANT_OF_NEXT_MONTH);
    expect(await countTakeawayGenerationsThisMonth(tenantId)).toBe(0);
  });
});
