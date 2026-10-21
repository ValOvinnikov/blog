import { getDb } from '@blog/db/client';
import { magicLinkSendCounters } from '@blog/db/schema/magic-link-send-counters';
import { sql } from 'drizzle-orm';

export async function incrementMagicLinkSendCount(
  key: string,
  windowMs: number,
): Promise<number> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const isWindowExpired = sql`${magicLinkSendCounters.windowStartedAt} <= ${windowStart.toISOString()}::timestamp`;

  const [counter] = await getDb()
    .insert(magicLinkSendCounters)
    .values({ key, windowStartedAt: now, count: 1 })
    .onConflictDoUpdate({
      target: magicLinkSendCounters.key,
      set: {
        count: sql`CASE WHEN ${isWindowExpired} THEN 1 ELSE ${magicLinkSendCounters.count} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${isWindowExpired} THEN ${now.toISOString()}::timestamp ELSE ${magicLinkSendCounters.windowStartedAt} END`,
      },
    })
    .returning({ count: magicLinkSendCounters.count });

  return counter?.count ?? 1;
}
