import { getDb } from '@blog/db/client';
import {
  PENDING_SUBSCRIBER_RETENTION_DAYS,
  SUBSCRIBER_STATUS,
} from '@blog/db/constants';
import { isInBatch } from '@blog/db/queries/retention/retention-batch';
import { daysBefore } from '@blog/db/queries/retention/retention-cutoff';
import { subscribers } from '@blog/db/schema/subscribers';
import { hasSubscriberStatus } from '@blog/db/utils/subscriber-status/subscriber-status';
import { and, isNull, lt, or } from 'drizzle-orm';

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
        hasSubscriberStatus(SUBSCRIBER_STATUS.PENDING),
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
