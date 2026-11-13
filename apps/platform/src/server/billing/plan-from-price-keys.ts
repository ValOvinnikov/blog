import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/config/constants';
import {
  PAID_SUBSCRIBER_BAND_CEILINGS,
  PLAN_PRICE_LOOKUP_KEYS,
  type TIntervalPriceLookupKeys,
  type TPaidSubscriberBandCeiling,
} from '@blog/db/constants';
import { hasArrayGotMultipleItems, isUndefined } from '@blog/utils/primitives';
import {
  BILLING_INTERVAL,
  type TBillingInterval,
} from '@platform/constants/billing';

export type TSubscribedPlan = {
  plan: TTenantPlan;
  subscriberBandCeiling: TMaybeNull<TPaidSubscriberBandCeiling>;
};

export type TSubscribedPrices = TSubscribedPlan & {
  interval: TBillingInterval;
};

type TPriceKeyMatch = { interval: TBillingInterval } & (
  | { plan: TTenantPlan; ceiling?: never }
  | { ceiling: TPaidSubscriberBandCeiling; plan?: never }
);

export const lookupKeyFor = (
  { monthly, yearly }: TIntervalPriceLookupKeys,
  interval: TBillingInterval,
): string => (interval === BILLING_INTERVAL.YEARLY ? yearly : monthly);

const byInterval = (
  keys: TIntervalPriceLookupKeys,
  match: Omit<TPriceKeyMatch, 'interval'>,
): [string, TPriceKeyMatch][] =>
  Object.values(BILLING_INTERVAL).map((interval) => [
    lookupKeyFor(keys, interval),
    { ...match, interval } as TPriceKeyMatch,
  ]);

const PRICE_KEY_MATCHES = new Map<string, TPriceKeyMatch>(
  Object.values(TENANT_PLAN).flatMap((plan) => {
    const keys = PLAN_PRICE_LOOKUP_KEYS[plan];
    if (!keys) return [];
    const { subscriberBands } = keys;
    const bandEntries = subscriberBands
      ? PAID_SUBSCRIBER_BAND_CEILINGS.flatMap((ceiling) =>
          byInterval(subscriberBands[ceiling], { ceiling }),
        )
      : [];
    return [...byInterval(keys, { plan }), ...bandEntries];
  }),
);

export const pricesFromKeys = (
  lookupKeys: TMaybeNull<string>[],
): TMaybeUndefined<TSubscribedPrices> => {
  const matches = lookupKeys.map((key) =>
    key ? PRICE_KEY_MATCHES.get(key) : undefined,
  );
  if (matches.some(isUndefined)) return undefined;

  const plans = matches.filter((match) => match?.plan);
  const ceilings = matches.flatMap((match) =>
    match?.ceiling ? [match.ceiling] : [],
  );
  const [planMatch] = plans;
  if (
    hasArrayGotMultipleItems(plans) ||
    hasArrayGotMultipleItems(ceilings) ||
    !planMatch?.plan
  ) {
    return undefined;
  }

  return {
    plan: planMatch.plan,
    interval: planMatch.interval,
    subscriberBandCeiling: ceilings[0] ?? null,
  };
};

export const planFromPriceKeys = (
  lookupKeys: TMaybeNull<string>[],
): TMaybeUndefined<TSubscribedPlan> => {
  const prices = pricesFromKeys(lookupKeys);
  if (!prices) return undefined;
  const { plan, subscriberBandCeiling } = prices;
  return { plan, subscriberBandCeiling };
};

export const bandKeyFor = (
  plan: TTenantPlan,
  interval: TBillingInterval,
  ceiling: TMaybeNull<TPaidSubscriberBandCeiling>,
): TMaybeUndefined<string> => {
  const bands = PLAN_PRICE_LOOKUP_KEYS[plan]?.subscriberBands;
  return bands && ceiling ? lookupKeyFor(bands[ceiling], interval) : undefined;
};
