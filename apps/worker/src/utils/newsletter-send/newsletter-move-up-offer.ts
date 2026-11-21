import {
  type TBillingInterval,
  type TTenantPlan,
} from '@shinefold/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import {
  PAID_SUBSCRIBER_BAND_CEILINGS,
  type TBillingCurrency,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';
import {
  listStripePrices,
  type TStripePrice,
} from '@shinefold/db/queries/stripe-catalogue';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { bandKeyFor } from '@shinefold/db/utils/price-lookup-key/price-lookup-key';
import { isUndefined } from '@shinefold/utils/primitives';

export type TNewsletterMoveUpOffer = {
  ceiling: TPaidSubscriberBandCeiling;
  interval: TBillingInterval;
  currency: TBillingCurrency;
  extraMinorUnits: number;
};

type TBandPricing = {
  plan: TTenantPlan;
  interval: TBillingInterval;
  currency: TBillingCurrency;
};

function nextPaidBand(
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<TPaidSubscriberBandCeiling> {
  return PAID_SUBSCRIBER_BAND_CEILINGS[
    ceiling ? PAID_SUBSCRIBER_BAND_CEILINGS.indexOf(ceiling) + 1 : 0
  ];
}

function bandAmount(
  prices: readonly TStripePrice[],
  { plan, interval, currency }: TBandPricing,
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<number> {
  if (!ceiling) return 0;
  const lookupKey = bandKeyFor(plan, interval, ceiling);
  return prices.find(
    (price) => price.lookupKey === lookupKey && price.currency === currency,
  )?.unitAmount;
}

export async function readNewsletterMoveUpOffer({
  plan,
  subscriberBandCeiling,
  billingInterval,
  billingCurrency,
}: TTenant): Promise<TMaybeUndefined<TNewsletterMoveUpOffer>> {
  const ceiling = nextPaidBand(subscriberBandCeiling);
  if (!ceiling || !billingInterval || !billingCurrency) return undefined;

  const prices = await listStripePrices();
  const pricing = {
    plan,
    interval: billingInterval,
    currency: billingCurrency,
  };
  const next = bandAmount(prices, pricing, ceiling);
  const current = bandAmount(prices, pricing, subscriberBandCeiling);
  if (!next || isUndefined(current)) return undefined;

  return {
    ceiling,
    interval: billingInterval,
    currency: billingCurrency,
    extraMinorUnits: next - current,
  };
}
