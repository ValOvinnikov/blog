import type { TStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import { nextSubscriberBand } from '@platform/utils/next-subscriber-band/next-subscriber-band';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import {
  type TBillingInterval,
  type TTenantPlan,
} from '@shinefold/config/constants';
import {
  PLAN_PRICE_LOOKUP_KEYS,
  type TBillingCurrency,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';
import type { TStripePrice } from '@shinefold/db/queries/stripe-catalogue/list-stripe-prices';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { monthlySendAllowance } from '@shinefold/db/utils/monthly-send-allowance/monthly-send-allowance';
import {
  bandKeyFor,
  lookupKeyFor,
} from '@shinefold/db/utils/price-lookup-key/price-lookup-key';
import { isUndefined } from '@shinefold/utils/primitives';

export type TMoveUpOffer = {
  ceiling: TPaidSubscriberBandCeiling;
  allowance: number;
  interval: TBillingInterval;
  extra: TStripeAmount;
};

type TBandPricing = {
  plan: TTenantPlan;
  interval: TBillingInterval;
  currency: TBillingCurrency;
};

export type TMoveUpBilling = Pick<
  TTenant,
  'plan' | 'subscriberBandCeiling' | 'billingInterval' | 'billingCurrency'
>;

const amountOf = (
  prices: readonly TStripePrice[],
  lookupKey: TMaybeUndefined<string>,
  currency: TBillingCurrency,
): TMaybeUndefined<number> =>
  prices.find(
    (price) => price.lookupKey === lookupKey && price.currency === currency,
  )?.unitAmount;

const bandAmountOf = (
  prices: readonly TStripePrice[],
  { plan, interval, currency }: TBandPricing,
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<number> =>
  ceiling ? amountOf(prices, bandKeyFor(plan, interval, ceiling), currency) : 0;

export const planTotalFor = (
  prices: readonly TStripePrice[],
  pricing: TBandPricing,
  ceiling: TPaidSubscriberBandCeiling,
): TMaybeUndefined<TStripeAmount> => {
  const keys = PLAN_PRICE_LOOKUP_KEYS[pricing.plan];
  const plan = keys
    ? amountOf(prices, lookupKeyFor(keys, pricing.interval), pricing.currency)
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
  const ceiling = nextSubscriberBand(subscriberBandCeiling);
  if (!ceiling || !billingInterval || !billingCurrency) return undefined;
  const pricing = {
    plan,
    interval: billingInterval,
    currency: billingCurrency,
  };
  const next = bandAmountOf(prices, pricing, ceiling);
  const current = bandAmountOf(prices, pricing, subscriberBandCeiling);
  if (!next || isUndefined(current)) return undefined;
  return {
    ceiling,
    allowance: monthlySendAllowance(plan, ceiling),
    interval: billingInterval,
    extra: { minorUnits: next - current, currency: billingCurrency },
  };
};
