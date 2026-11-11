import { getDb } from '@blog/db/client';
import {
  STRIPE_EVENT_RECORD_OUTCOME,
  type TStripeEventRecordOutcome,
} from '@blog/db/constants';
import { stripeWebhookEvents } from '@blog/db/schema/stripe-webhook-events';

export async function recordStripeEvent(
  eventId: string,
): Promise<TStripeEventRecordOutcome> {
  const [recorded] = await getDb()
    .insert(stripeWebhookEvents)
    .values({ eventId, handledAt: new Date() })
    .onConflictDoNothing()
    .returning({ eventId: stripeWebhookEvents.eventId });

  return recorded
    ? STRIPE_EVENT_RECORD_OUTCOME.RECORDED
    : STRIPE_EVENT_RECORD_OUTCOME.ALREADY_HANDLED;
}
