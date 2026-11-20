import {
  BILLING_INTERVAL,
  type TBillingInterval,
  type TTenantPlan,
} from '@shinefold/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import {
  PLAN_PRICE_LOOKUP_KEYS,
  type TIntervalPriceLookupKeys,
  type TPaidSubscriberBandCeiling,
  type TStripePriceLookupKey,
} from '@shinefold/db/constants';

export function lookupKeyFor(
  { monthly, yearly }: TIntervalPriceLookupKeys,
  interval: TBillingInterval,
): TStripePriceLookupKey {
  return interval === BILLING_INTERVAL.YEARLY ? yearly : monthly;
}

export function bandKeyFor(
  plan: TTenantPlan,
  interval: TBillingInterval,
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<TStripePriceLookupKey> {
  const bands = PLAN_PRICE_LOOKUP_KEYS[plan]?.subscriberBands;
  return bands && ceiling ? lookupKeyFor(bands[ceiling], interval) : undefined;
}
