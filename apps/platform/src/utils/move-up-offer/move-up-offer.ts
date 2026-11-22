import { type TStripeAmount, type TMaybeUndefined } from '@shinefold/config';
import type { TBillingInterval } from '@shinefold/config/constants';
import {
  PLAN_PRICE_LOOKUP_KEYS,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';
import type { TStripePrice } from '@shinefold/db/queries/stripe-catalogue/list-stripe-prices';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  bandAmountOf,
  bandMoveUpFor,
  catalogueAmountOf,
  type TBandPricing,
} from '@shinefold/db/utils/band-price/band-price';
import { monthlySendAllowance } from '@shinefold/db/utils/monthly-send-allowance/monthly-send-allowance';
import { lookupKeyFor } from '@shinefold/db/utils/price-lookup-key/price-lookup-key';
import { isUndefined } from '@shinefold/utils/primitives';

export type TMoveUpOffer = {
  ceiling: TPaidSubscriberBandCeiling;
  allowance: number;
  interval: TBillingInterval;
  extra: TStripeAmount;
};

export type TMoveUpBilling = Pick<
  TTenant,
  'plan' | 'subscriberBandCeiling' | 'billingInterval' | 'billingCurrency'
>;

export const planTotalFor = (
  prices: readonly TStripePrice[],
  pricing: TBandPricing,
  ceiling: TPaidSubscriberBandCeiling,
): TMaybeUndefined<TStripeAmount> => {
  const keys = PLAN_PRICE_LOOKUP_KEYS[pricing.plan];
  const plan = keys
    ? catalogueAmountOf(
        prices,
        lookupKeyFor(keys, pricing.interval),
        pricing.currency,
      )
    : undefined;
  const band = bandAmountOf(prices, pricing, ceiling);
  if (isUndefined(plan) || isUndefined(band)) return undefined;
  return { minorUnits: plan + band, currency: pricing.currency };
};

export const moveUpOfferFor = (
  {
    plan,
    subscriberBandCeiling,
    billingInterval,
    billingCurrency,
  }: TMoveUpBilling,
  prices: readonly TStripePrice[],
): TMaybeUndefined<TMoveUpOffer> => {
  if (!billingInterval || !billingCurrency) return undefined;
  const moveUp = bandMoveUpFor(
    prices,
    { plan, interval: billingInterval, currency: billingCurrency },
    subscriberBandCeiling,
  );
  if (!moveUp) return undefined;
  const { ceiling, extraMinorUnits } = moveUp;
  return {
    ceiling,
    allowance: monthlySendAllowance(plan, ceiling),
    interval: billingInterval,
    extra: { minorUnits: extraMinorUnits, currency: billingCurrency },
  };
};
