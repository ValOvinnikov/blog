import 'server-only';

import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { SELLABLE_TENANT_PLANS } from '@blog/config/constants';
import type { TPaidSubscriberBandCeiling } from '@blog/db/constants';
import { isOneOf, isString } from '@blog/utils/primitives';
import { STRIPE_SUBSCRIPTION_STATUS } from '@platform/constants/billing';
import { type TPlanChoice } from '@platform/constants/plan-change';
import { isSamePlanChoice } from '@platform/utils/plan-change-timing/plan-change-timing';
import type Stripe from 'stripe';

import { planFromPriceKeys, pricesFromKeys } from './plan-from-price-keys';
import { stripeIdOf } from './stripe-id';
import { fromStripeTime } from './stripe-time';

type TSubscribedChoice = TPlanChoice & {
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>;
};

export type TPendingPlanChange = TPlanChoice & { startsAt: Date };

export type TSubscriptionPlan = {
  id: string;
  current: TSubscribedChoice;
  isChangeable: boolean;
  renewsAt: Date;
  scheduleId: TMaybeUndefined<string>;
  pending: TMaybeUndefined<TPendingPlanChange>;
  planItemId: string;
  bandItem: TMaybeUndefined<{ id: string; quantity: number }>;
};

type TStripePrice = string | Stripe.Price | Stripe.DeletedPrice;

const SUBSCRIPTION_EXPAND = ['schedule.phases.items.price'];

const CHANGEABLE_STATUSES = [
  STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
  STRIPE_SUBSCRIPTION_STATUS.TRIALING,
] as const;

const lookupKeyOf = (price: TStripePrice): TMaybeNull<string> =>
  isString(price) || price.deleted ? null : price.lookup_key;

const subscribedChoice = (
  prices: TStripePrice[],
): TMaybeUndefined<TSubscribedChoice> => {
  const subscribed = pricesFromKeys(prices.map(lookupKeyOf));
  if (!subscribed || !isOneOf(SELLABLE_TENANT_PLANS, subscribed.plan)) {
    return undefined;
  }
  const { plan, interval, subscriberBandCeiling } = subscribed;
  return { plan, interval, ceiling: subscriberBandCeiling };
};

const pendingChangeOf = (
  schedule: Stripe.Subscription['schedule'],
  current: TPlanChoice,
): TMaybeUndefined<TPendingPlanChange> => {
  if (!schedule || isString(schedule) || !schedule.current_phase) {
    return undefined;
  }
  const { end_date } = schedule.current_phase;
  const next = schedule.phases.find(({ start_date }) => start_date >= end_date);
  const choice = next && subscribedChoice(next.items.map(({ price }) => price));
  if (!next || !choice || isSamePlanChoice(choice, current)) return undefined;
  const { plan, interval } = choice;
  return { plan, interval, startsAt: fromStripeTime(next.start_date) };
};

export const loadSubscriptionPlan = async (
  stripe: Stripe,
  subscriptionId: string,
): Promise<TMaybeUndefined<TSubscriptionPlan>> => {
  const { id, status, cancel_at_period_end, schedule, items } =
    await stripe.subscriptions.retrieve(subscriptionId, {
      expand: SUBSCRIPTION_EXPAND,
    });
  const current = subscribedChoice(items.data.map(({ price }) => price));
  const planItem = items.data.find(({ price }) =>
    planFromPriceKeys([price.lookup_key]),
  );
  if (!current || !planItem) return undefined;

  const band = items.data.find((item) => item !== planItem);
  return {
    id,
    current,
    isChangeable: !cancel_at_period_end && isOneOf(CHANGEABLE_STATUSES, status),
    renewsAt: fromStripeTime(planItem.current_period_end),
    scheduleId: schedule ? stripeIdOf(schedule) : undefined,
    pending: pendingChangeOf(schedule, current),
    planItemId: planItem.id,
    bandItem: band && { id: band.id, quantity: band.quantity ?? 1 },
  };
};
