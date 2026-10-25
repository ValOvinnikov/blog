import { getDb } from '@blog/db/client';
import { PENDING_SUBSCRIBER_RETENTION_DAYS } from '@blog/db/constants';
import { daysBefore } from '@blog/db/queries/retention/retention-cutoff';
import { subscribers } from '@blog/db/schema/subscribers';
import { and, eq, isNull, lt, or } from 'drizzle-orm';

export async function deletePendingSubscribersPastRetention(
  now: Date,
): Promise<number> {
  const cutoff = daysBefore(now, PENDING_SUBSCRIBER_RETENTION_DAYS);

  const deleted = await getDb()
    .delete(subscribers)
    .where(
      and(
        eq(subscribers.status, 'pending'),
        or(
          lt(subscribers.confirmationSentAt, cutoff),
          and(
            isNull(subscribers.confirmationSentAt),
            lt(subscribers.subscribedAt, cutoff),
          ),
        ),
      ),
    )
    .returning({ id: subscribers.id });

  return deleted.length;
}
