import type {
  TBillingInterval,
  TTenantPlan,
} from '@shinefold/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import type {
  TBillingCurrency,
  TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';
import type { TStripePrice } from '@shinefold/db/queries/stripe-catalogue/list-stripe-prices';
import { nextSubscriberBand } from '@shinefold/db/utils/next-subscriber-band/next-subscriber-band';
import { bandKeyFor } from '@shinefold/db/utils/price-lookup-key/price-lookup-key';
import { isUndefined } from '@shinefold/utils/primitives';

export type TBandPricing = {
  plan: TTenantPlan;
  interval: TBillingInterval;
  currency: TBillingCurrency;
};

export type TBandMoveUp = {
  ceiling: TPaidSubscriberBandCeiling;
  extraMinorUnits: number;
};

export function catalogueAmountOf(
  prices: readonly TStripePrice[],
  lookupKey: TMaybeUndefined<string>,
  currency: TBillingCurrency,
): TMaybeUndefined<number> {
  return prices.find(
    (price) => price.lookupKey === lookupKey && price.currency === currency,
  )?.unitAmount;
}

export function bandAmountOf(
  prices: readonly TStripePrice[],
  { plan, interval, currency }: TBandPricing,
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<number> {
  if (!ceiling) return 0;
  return catalogueAmountOf(
    prices,
    bandKeyFor(plan, interval, ceiling),
    currency,
  );
}

export function bandMoveUpFor(
  prices: readonly TStripePrice[],
  pricing: TBandPricing,
  currentCeiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<TBandMoveUp> {
  const ceiling = nextSubscriberBand(currentCeiling);
  if (!ceiling) return undefined;
  const next = bandAmountOf(prices, pricing, ceiling);
  const current = bandAmountOf(prices, pricing, currentCeiling);
  if (!next || isUndefined(current)) return undefined;
  return { ceiling, extraMinorUnits: next - current };
}
