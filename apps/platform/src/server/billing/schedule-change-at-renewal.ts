import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { type TBillingInterval } from '@platform/constants/billing';
import { STRIPE_RECURRING_INTERVAL } from '@platform/constants/plan-change';
import type Stripe from 'stripe';

import type { TSubscriptionPlan } from './load-subscription-plan';
import { stripeIdOf } from './stripe-id';

export type TTargetPrices = { plan: string; band: TMaybeUndefined<string> };

type TPhase = Stripe.SubscriptionSchedule.Phase;
type TPhaseParams = Stripe.SubscriptionScheduleUpdateParams.Phase;

const discountParam = ({
  discount,
  coupon,
  promotion_code,
}: Stripe.SubscriptionSchedule.Phase.Discount) => {
  if (discount) return { discount: stripeIdOf(discount) };
  if (coupon) return { coupon: stripeIdOf(coupon) };
  return promotion_code ? { promotion_code: stripeIdOf(promotion_code) } : {};
};

const carriedSettings = ({ discounts, automatic_tax }: TPhase) => ({
  discounts: discounts.map(discountParam),
  automatic_tax: automatic_tax && { enabled: automatic_tax.enabled },
});

const currentPhaseParams = (phase: TPhase): TPhaseParams => ({
  ...carriedSettings(phase),
  items: phase.items.map(({ price, quantity }) => ({
    price: stripeIdOf(price),
    quantity,
  })),
  start_date: phase.start_date,
  end_date: phase.end_date,
});

const nextPhaseParams = (
  phase: TPhase,
  { bandItem }: TSubscriptionPlan,
  prices: TTargetPrices,
  interval: TBillingInterval,
): TPhaseParams => ({
  ...carriedSettings(phase),
  items: [
    { price: prices.plan, quantity: 1 },
    ...(bandItem && prices.band
      ? [{ price: prices.band, quantity: bandItem.quantity }]
      : []),
  ],
  duration: {
    interval: STRIPE_RECURRING_INTERVAL[interval],
    interval_count: 1,
  },
  proration_behavior: 'none',
});

export const scheduleChangeAtRenewal = async (
  stripe: Stripe,
  subscription: TSubscriptionPlan,
  prices: TTargetPrices,
  interval: TBillingInterval,
): Promise<void> => {
  const { id, phases } = await stripe.subscriptionSchedules.create({
    from_subscription: subscription.id,
  });
  const [current] = phases;
  if (!current) {
    throw new Error(
      `scheduleChangeAtRenewal: schedule "${id}" has no current phase.`,
    );
  }
  await stripe.subscriptionSchedules.update(id, {
    end_behavior: 'release',
    proration_behavior: 'none',
    phases: [
      currentPhaseParams(current),
      nextPhaseParams(current, subscription, prices, interval),
    ],
  });
};
