import type { TMaybeUndefined } from '@shinefold/config';
import type Stripe from 'stripe';

import { fromStripeTime } from './stripe-time';

type TEndingSubscription = Pick<
  Stripe.Subscription,
  'cancel_at' | 'cancel_at_period_end' | 'items'
>;

// A Portal cancel sets `cancel_at` and leaves `cancel_at_period_end` false, so both count as cancelling.
export const subscriptionEndsAt = ({
  cancel_at,
  cancel_at_period_end,
  items,
}: TEndingSubscription): TMaybeUndefined<Date> => {
  if (cancel_at) return fromStripeTime(cancel_at);
  const [item] = items.data;
  return cancel_at_period_end && item
    ? fromStripeTime(item.current_period_end)
    : undefined;
};
