import type { TMaybeUndefined } from '@shinefold/config';
import type Stripe from 'stripe';

import type { TSubscriptionPlan } from './load-subscription-plan';
import type { TTargetPrices } from './schedule-change-at-renewal';

type TSubscriptionItem = Stripe.SubscriptionUpdateParams.Item;

const bandItemsFor = (
  bandItem: TSubscriptionPlan['bandItem'],
  band: TMaybeUndefined<string>,
): TSubscriptionItem[] => {
  if (!bandItem) return band ? [{ price: band }] : [];
  return [
    band
      ? { id: bandItem.id, price: band }
      : { id: bandItem.id, deleted: true },
  ];
};

export const subscriptionItemsFor = (
  { planItemId, bandItem }: TSubscriptionPlan,
  { plan, band }: TTargetPrices,
): TSubscriptionItem[] => [
  { id: planItemId, price: plan },
  ...bandItemsFor(bandItem, band),
];
