import { SUBSCRIBER_OUTCOME, type TOutcome } from '@blog/config';
import type { TSubscriberStatus } from '@blog/db/constants';
import { findUserSubscriber } from '@blog/db/queries/subscribers/user-subscriber';
import { toOutcome } from '@blog/utils/to-outcome';

export type TSubscriptionStatusResult = TOutcome<
  TSubscriberStatus | typeof SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED
>;

export async function getSubscriptionStatus(
  tenantId: string,
  userId: string,
): Promise<TSubscriptionStatusResult> {
  const subscriber = await findUserSubscriber(tenantId, userId);

  return toOutcome(subscriber?.status ?? SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED);
}
