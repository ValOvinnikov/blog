import { STRIPE_LIVE_SUBSCRIPTION_STATUSES } from '@platform/constants/billing';
import type { TMaybeUndefined } from '@shinefold/config';
import { isOneOf } from '@shinefold/utils/primitives';
import type Stripe from 'stripe';

import { fromStripeTime } from './stripe-time';

type TEndingSubscription = Pick<
  Stripe.Subscription,
  'status' | 'cancel_at' | 'cancel_at_period_end' | 'items'
>;

// A Portal cancel sets `cancel_at` and leaves `cancel_at_period_end` false, so both count as cancelling.
export const subscriptionEndsAt = ({
  status,
  cancel_at,
  cancel_at_period_end,
  items,
}: TEndingSubscription): TMaybeUndefined<Date> => {
  if (!isOneOf(STRIPE_LIVE_SUBSCRIPTION_STATUSES, status)) return undefined;
  if (cancel_at) return fromStripeTime(cancel_at);
  const [item] = items.data;
  return cancel_at_period_end && item
    ? fromStripeTime(item.current_period_end)
    : undefined;
};
