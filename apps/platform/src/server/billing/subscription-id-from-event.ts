import type { TMaybeUndefined } from '@blog/config';
import { STRIPE_EVENT_TYPE } from '@platform/constants/billing';
import { stripeIdOf } from '@platform/server/billing/stripe-id';
import type Stripe from 'stripe';

export const subscriptionIdFromEvent = (
  event: Stripe.Event,
): TMaybeUndefined<string> => {
  switch (event.type) {
    case STRIPE_EVENT_TYPE.SUBSCRIPTION_CREATED:
    case STRIPE_EVENT_TYPE.SUBSCRIPTION_UPDATED:
    case STRIPE_EVENT_TYPE.SUBSCRIPTION_DELETED:
      return event.data.object.id;
    case STRIPE_EVENT_TYPE.INVOICE_PAID:
    case STRIPE_EVENT_TYPE.INVOICE_PAYMENT_FAILED: {
      const subscription =
        event.data.object.parent?.subscription_details?.subscription;
      return subscription ? stripeIdOf(subscription) : undefined;
    }
    default:
      return undefined;
  }
};
