import type { TOutcome } from '@blog/config';
import { findUserSubscriber } from '@blog/db/queries/subscribers/user-subscriber';
import type { TSubscriberStatus } from '@blog/db/schema/subscribers';
import { toOutcome } from '@blog/utils/to-outcome';

export type TSubscriptionStatusResult = TOutcome<
  TSubscriberStatus | 'not-subscribed'
>;

export async function getSubscriptionStatus(
  tenantId: string,
  userId: string,
): Promise<TSubscriptionStatusResult> {
  const subscriber = await findUserSubscriber(tenantId, userId);

  return toOutcome(subscriber?.status ?? 'not-subscribed');
}
