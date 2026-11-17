import * as schema from '@shinefold/db/schema';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestTakeawayGenerationCount,
  MOCK_THIS_MONTH,
  readTakeawayGenerationCounts,
} from '@shinefold/db/testing/takeaway-generations/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { releaseTakeawayGeneration } from './release-takeaway-generation';

vi.mock('@shinefold/db/client');

const MOCK_USED_COUNT = 3;

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.takeawayGenerationCounts);
});

describe(releaseTakeawayGeneration, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('gives the claimed generation back to the month', async () => {
    await insertTestTakeawayGenerationCount(db(), tenantId, MOCK_USED_COUNT);

    await releaseTakeawayGeneration({ tenantId, month: MOCK_THIS_MONTH });

    const [row] = await readTakeawayGenerationCounts(db());
    expect(row?.count).toBe(MOCK_USED_COUNT - 1);
  });

  it('never takes the count below zero', async () => {
    await insertTestTakeawayGenerationCount(db(), tenantId, 0);

    await releaseTakeawayGeneration({ tenantId, month: MOCK_THIS_MONTH });

    const [row] = await readTakeawayGenerationCounts(db());
    expect(row?.count).toBe(0);
  });
});
