import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { PLAN_PRICE_LOOKUP_KEYS } from '@blog/db/constants';
import { BILLING_LOG } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
  type TPlanChangeTiming,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { logger } from '@platform/utils/logger/logger';
import { planChangeTiming } from '@platform/utils/plan-change-timing/plan-change-timing';
import type Stripe from 'stripe';

import type { TSubscriptionPlan } from './load-subscription-plan';
import { bandKeyFor, lookupKeyFor } from './plan-from-price-keys';
import {
  scheduleChangeAtRenewal,
  type TTargetPrices,
} from './schedule-change-at-renewal';

export type TPlanChangeResult =
  TPlanChangeTiming | typeof PLAN_CHANGE_REFUSAL.UNCHANGED | undefined;

const findTargetPrices = async (
  stripe: Stripe,
  { current }: TSubscriptionPlan,
  { plan, interval }: TPlanChoice,
): Promise<TMaybeUndefined<TTargetPrices>> => {
  const planKey = lookupKeyFor(PLAN_PRICE_LOOKUP_KEYS[plan], interval);
  const bandKey = bandKeyFor(plan, interval, current.ceiling);
  const lookupKeys = bandKey ? [planKey, bandKey] : [planKey];
  const { data } = await stripe.prices.list({
    lookup_keys: lookupKeys,
    active: true,
    limit: lookupKeys.length,
  });
  const idOf = (key: string) =>
    data.find(({ lookup_key }) => lookup_key === key)?.id;
  const planPrice = idOf(planKey);
  const bandPrice = bandKey && idOf(bandKey);
  if (!planPrice || (bandKey && !bandPrice)) return undefined;
  return { plan: planPrice, band: bandPrice };
};

const changeNow = (
  stripe: Stripe,
  { id, planItemId, bandItem }: TSubscriptionPlan,
  prices: TTargetPrices,
) => {
  const bandItems = bandItem
    ? [
        prices.band
          ? { id: bandItem.id, price: prices.band }
          : { id: bandItem.id, deleted: true },
      ]
    : [];
  return stripe.subscriptions.update(id, {
    items: [{ id: planItemId, price: prices.plan }, ...bandItems],
    proration_behavior: 'always_invoice',
    payment_behavior: 'error_if_incomplete',
  });
};

export const changeSubscriptionPlan = async (
  stripe: Stripe,
  subscription: TSubscriptionPlan,
  to: TPlanChoice,
  tenantId: string,
): Promise<TPlanChangeResult> => {
  const { scheduleId } = subscription;
  const timing = planChangeTiming(subscription.current, to);
  if (!timing && !scheduleId) return PLAN_CHANGE_REFUSAL.UNCHANGED;

  const prices = timing && (await findTargetPrices(stripe, subscription, to));
  if (timing && !prices) {
    logger.error(BILLING_LOG.PLAN_CHANGE_PRICE_MISSING, { tenantId, ...to });
    return undefined;
  }

  if (scheduleId) await stripe.subscriptionSchedules.release(scheduleId);
  if (!timing || !prices) return PLAN_CHANGE_TIMING.CANCEL_PENDING;

  if (timing === PLAN_CHANGE_TIMING.NOW) {
    await changeNow(stripe, subscription, prices);
  } else {
    await scheduleChangeAtRenewal(stripe, subscription, prices, to.interval);
  }
  return timing;
};
