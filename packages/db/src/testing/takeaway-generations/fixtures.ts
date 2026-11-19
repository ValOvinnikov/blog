import * as schema from '@shinefold/db/schema';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { utcDayDaysBefore, utcMonthStartDay } from '@shinefold/utils/date';

export const MOCK_THIS_MONTH = utcMonthStartDay(MOCK_NOW);
export const MOCK_LAST_MONTH = utcMonthStartDay(
  new Date(utcDayDaysBefore(MOCK_NOW, 31)),
);

export async function readTakeawayGenerationCounts(
  db: TTestDb,
): Promise<schema.TTakeawayGenerationCount[]> {
  return db.select().from(schema.takeawayGenerationCounts);
}

export async function insertTestTakeawayGenerationCount(
  db: TTestDb,
  tenantId: string,
  count: number,
  month: string = MOCK_THIS_MONTH,
): Promise<void> {
  await db
    .insert(schema.takeawayGenerationCounts)
    .values({ tenantId, month, count });
}
