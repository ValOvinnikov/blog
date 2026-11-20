import { getDb } from '@shinefold/db/client';
import type { magicLinkSendCounters } from '@shinefold/db/schema/magic-link-send-counters';
import type { testEmailSendCounters } from '@shinefold/db/schema/test-email-send-counters';
import { sql } from 'drizzle-orm';

type TFixedWindowCounterTable =
  typeof magicLinkSendCounters | typeof testEmailSendCounters;

export type TFixedWindowCount = {
  count: number;
  windowStartedAt: Date;
};

export async function incrementFixedWindowCount(
  table: TFixedWindowCounterTable,
  key: string,
  windowMs: number,
): Promise<TFixedWindowCount> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const isWindowExpired = sql`${table.windowStartedAt} <= ${windowStart.toISOString()}::timestamp`;

  const [counter] = await getDb()
    .insert(table)
    .values({ key, windowStartedAt: now, count: 1 })
    .onConflictDoUpdate({
      target: table.key,
      set: {
        count: sql`CASE WHEN ${isWindowExpired} THEN 1 ELSE ${table.count} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${isWindowExpired} THEN ${now.toISOString()}::timestamp ELSE ${table.windowStartedAt} END`,
      },
    })
    .returning({ count: table.count, windowStartedAt: table.windowStartedAt });

  return counter ?? { count: 1, windowStartedAt: now };
}
