import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import {
  STRIPE_PRORATION_BEHAVIOR,
  STRIPE_RECURRING_INTERVAL,
  type TBillingInterval,
} from '@platform/constants/billing';
import Stripe from 'stripe';

import type { TSubscriptionPlan } from './load-subscription-plan';
import { hasScheduleEnded, releaseSchedule } from './release-schedule';
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
  proration_behavior: STRIPE_PRORATION_BEHAVIOR.NONE,
});

const createScheduleFrom = async (stripe: Stripe, subscriptionId: string) => {
  const create = () =>
    stripe.subscriptionSchedules.create({ from_subscription: subscriptionId });
  try {
    return await create();
  } catch (error) {
    if (!(error instanceof Stripe.errors.StripeInvalidRequestError))
      throw error;
    const { schedule } = await stripe.subscriptions.retrieve(subscriptionId);
    if (!schedule) throw error;
    await releaseSchedule(stripe, stripeIdOf(schedule));
    return create();
  }
};

const isSupersededByAnotherTab = async (
  stripe: Stripe,
  error: unknown,
  scheduleId: string,
  subscriptionId: string,
) => {
  if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) return false;
  if (!(await hasScheduleEnded(stripe, scheduleId))) return false;
  const { schedule } = await stripe.subscriptions.retrieve(subscriptionId);
  return Boolean(schedule);
};

export const scheduleChangeAtRenewal = async (
  stripe: Stripe,
  subscription: TSubscriptionPlan,
  prices: TTargetPrices,
  interval: TBillingInterval,
): Promise<void> => {
  const { scheduleId } = subscription;
  if (scheduleId) await releaseSchedule(stripe, scheduleId);
  const { id, phases } = await createScheduleFrom(stripe, subscription.id);
  const [current] = phases;
  if (!current) {
    throw new Error(
      `scheduleChangeAtRenewal: schedule "${id}" has no current phase.`,
    );
  }
  try {
    await stripe.subscriptionSchedules.update(id, {
      end_behavior: 'release',
      proration_behavior: STRIPE_PRORATION_BEHAVIOR.NONE,
      phases: [
        currentPhaseParams(current),
        nextPhaseParams(current, subscription, prices, interval),
      ],
    });
  } catch (error) {
    if (!(await isSupersededByAnotherTab(stripe, error, id, subscription.id)))
      throw error;
  }
};
