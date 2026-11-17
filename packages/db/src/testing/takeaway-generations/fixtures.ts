import * as schema from '@shinefold/db/schema';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { utcMonthStartDay } from '@shinefold/utils/date';

export const MOCK_THIS_MONTH = utcMonthStartDay(MOCK_NOW);

export async function readTakeawayGenerationCounts(
  db: TTestDb,
): Promise<schema.TTakeawayGenerationCount[]> {
  return db.select().from(schema.takeawayGenerationCounts);
}

export async function insertTestTakeawayGenerationCount(
  db: TTestDb,
  tenantId: string,
  count: number,
): Promise<void> {
  await db
    .insert(schema.takeawayGenerationCounts)
    .values({ tenantId, month: MOCK_THIS_MONTH, count });
}
