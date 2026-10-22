import type { TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { findUserSubscriberEmailIndex } from '@blog/db/queries/subscribers/user-email-index';
import {
  subscribers,
  type TSubscriberStatus,
} from '@blog/db/schema/subscribers';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export type TSubscriptionStatusResult = TOutcome<
  TSubscriberStatus | 'not-subscribed'
>;

export async function getSubscriptionStatus(
  tenantId: string,
  userId: string,
): Promise<TSubscriptionStatusResult> {
  const emailIndex = await findUserSubscriberEmailIndex(userId);

  const [subscriber] = emailIndex
    ? await getDb()
        .select({ status: subscribers.status })
        .from(subscribers)
        .where(
          and(
            eq(subscribers.tenantId, tenantId),
            eq(subscribers.emailIndex, emailIndex),
          ),
        )
    : [];

  return toOutcome(subscriber?.status ?? 'not-subscribed');
}
