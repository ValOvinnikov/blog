import type { TEmailType } from '@blog/config/constants';
import type { TEmailDeliveryOutcome } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { utcDay, utcDayDaysBefore } from '@blog/db/utils/utc-day/utc-day';

export const MOCK_TODAY = utcDay(MOCK_NOW);
export const MOCK_LAST_MONTH_DAY = utcDayDaysBefore(MOCK_NOW, 31);

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
