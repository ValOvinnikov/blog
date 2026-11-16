import type { TEmailType } from '@shinefold/config/constants';
import type { TEmailDeliveryOutcome } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { utcDay, utcDayDaysBefore } from '@shinefold/utils/date';

export const MOCK_TODAY = utcDay(MOCK_NOW);
export const MOCK_LAST_MONTH_DAY = utcDayDaysBefore(MOCK_NOW, 31);
export const MOCK_DELIVERY_EVENT_IDS = [
  'evt_first',
  'evt_second',
  'evt_third',
] as const;

export async function readEmailSendCounts(
  db: TTestDb,
): Promise<schema.TEmailSendCount[]> {
  return db.select().from(schema.emailSendCounts);
}

export async function readEmailDeliveryOutcomeCounts(
  db: TTestDb,
): Promise<schema.TEmailDeliveryOutcomeCount[]> {
  return db.select().from(schema.emailDeliveryOutcomeCounts);
}

export async function insertTestEmailSendCount(
  db: TTestDb,
  tenantId: string,
  emailType: TEmailType,
  day: string,
  count: number,
): Promise<void> {
  await db
    .insert(schema.emailSendCounts)
    .values({ tenantId, emailType, day, count });
}

export async function insertTestEmailDeliveryOutcomeCount(
  db: TTestDb,
  tenantId: string,
  outcome: TEmailDeliveryOutcome,
  day: string,
  count: number,
): Promise<void> {
  await db
    .insert(schema.emailDeliveryOutcomeCounts)
    .values({ tenantId, outcome, day, count });
}
