import 'server-only';

import type { TPlanChoice } from '@platform/constants/plan-change';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import {
  PLAN_PRICE_LOOKUP_KEYS,
  type TPaidSubscriberBandCeiling,
} from '@shinefold/db/constants';
import {
  bandKeyFor,
  lookupKeyFor,
} from '@shinefold/db/utils/price-lookup-key/price-lookup-key';
import type Stripe from 'stripe';

import type { TTargetPrices } from './schedule-change-at-renewal';

export const findTargetPrices = async (
  stripe: Stripe,
  { plan, interval }: TPlanChoice,
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): Promise<TMaybeUndefined<TTargetPrices>> => {
  const planKey = lookupKeyFor(PLAN_PRICE_LOOKUP_KEYS[plan], interval);
  const bandKey = bandKeyFor(plan, interval, ceiling);
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
