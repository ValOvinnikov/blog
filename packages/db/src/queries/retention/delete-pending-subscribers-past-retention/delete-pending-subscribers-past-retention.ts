import { getDb } from '@shinefold/db/client';
import {
  PENDING_SUBSCRIBER_RETENTION_DAYS,
  SUBSCRIBER_STATUS,
} from '@shinefold/db/constants';
import { isInBatch } from '@shinefold/db/queries/retention/retention-batch';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { daysBefore } from '@shinefold/db/utils/day-offset/day-offset';
import { and, eq, isNull, lt, or } from 'drizzle-orm';

export async function deletePendingSubscribersPastRetention(
  now: Date,
  limit: number,
): Promise<number> {
  const cutoff = daysBefore(now, PENDING_SUBSCRIBER_RETENTION_DAYS);
  const db = getDb();
  const batch = db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.status, SUBSCRIBER_STATUS.PENDING),
        or(
          lt(subscribers.confirmationSentAt, cutoff),
          and(
            isNull(subscribers.confirmationSentAt),
            lt(subscribers.subscribedAt, cutoff),
          ),
        ),
      ),
    )
    .limit(limit);

  const deleted = await db
    .delete(subscribers)
    .where(isInBatch(subscribers.id, batch))
    .returning({ id: subscribers.id });

  return deleted.length;
}
