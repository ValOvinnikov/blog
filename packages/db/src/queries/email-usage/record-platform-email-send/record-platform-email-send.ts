import type { TEmailType } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { platformEmailSendCounts } from '@shinefold/db/schema/email-usage';
import { utcDay } from '@shinefold/utils/date';
import { sql } from 'drizzle-orm';

export async function recordPlatformEmailSend(
  emailType: TEmailType,
): Promise<void> {
  await getDb()
    .insert(platformEmailSendCounts)
    .values({ day: utcDay(new Date()), emailType, count: 1 })
    .onConflictDoUpdate({
      target: [platformEmailSendCounts.day, platformEmailSendCounts.emailType],
      set: { count: sql`${platformEmailSendCounts.count} + 1` },
    });
}
