import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { testEmailSendCounters } from '@shinefold/db/schema/test-email-send-counters';
import type { TFixedWindowCount } from '@shinefold/db/utils/increment-fixed-window-count/increment-fixed-window-count';
import { and, eq, gt } from 'drizzle-orm';

export async function getTestEmailSendCount(
  key: string,
  windowMs: number,
): Promise<TMaybeUndefined<TFixedWindowCount>> {
  const windowStart = new Date(Date.now() - windowMs);
  const [counter] = await getDb()
    .select({
      count: testEmailSendCounters.count,
      windowStartedAt: testEmailSendCounters.windowStartedAt,
    })
    .from(testEmailSendCounters)
    .where(
      and(
        eq(testEmailSendCounters.key, key),
        gt(testEmailSendCounters.windowStartedAt, windowStart),
      ),
    );

  return counter;
}
