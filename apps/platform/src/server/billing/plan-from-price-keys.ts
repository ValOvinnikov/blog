import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/config/constants';
import {
  PAID_SUBSCRIBER_BAND_CEILINGS,
  PLAN_PRICE_LOOKUP_KEYS,
  type TPaidSubscriberBandCeiling,
} from '@blog/db/constants';
import { hasArrayGotMultipleItems, isUndefined } from '@blog/utils/primitives';

export type TSubscribedPlan = {
  plan: TTenantPlan;
  subscriberBandCeiling: TMaybeNull<TPaidSubscriberBandCeiling>;
};

type TPriceKeyMatch =
  | { plan: TTenantPlan; ceiling?: never }
  | { ceiling: TPaidSubscriberBandCeiling; plan?: never };

const PRICE_KEY_MATCHES = new Map<string, TPriceKeyMatch>(
  Object.values(TENANT_PLAN).flatMap((plan) => {
    const keys = PLAN_PRICE_LOOKUP_KEYS[plan];
    if (!keys) return [];
    const { monthly, yearly, subscriberBands } = keys;
    const bandEntries = subscriberBands
      ? PAID_SUBSCRIBER_BAND_CEILINGS.flatMap((ceiling) =>
          Object.values(subscriberBands[ceiling]).map(
            (key): [string, TPriceKeyMatch] => [key, { ceiling }],
          ),
        )
      : [];
    return [
      ...[monthly, yearly].map((key): [string, TPriceKeyMatch] => [
        key,
        { plan },
      ]),
      ...bandEntries,
    ];
  }),
);

export const planFromPriceKeys = (
  lookupKeys: TMaybeNull<string>[],
): TMaybeUndefined<TSubscribedPlan> => {
  const matches = lookupKeys.map((key) =>
    key ? PRICE_KEY_MATCHES.get(key) : undefined,
  );
  if (matches.some(isUndefined)) return undefined;

  const plans = matches.flatMap((match) => (match?.plan ? [match.plan] : []));
  const ceilings = matches.flatMap((match) =>
    match?.ceiling ? [match.ceiling] : [],
  );
  const [plan] = plans;
  if (
    hasArrayGotMultipleItems(plans) ||
    hasArrayGotMultipleItems(ceilings) ||
    isUndefined(plan)
  ) {
    return undefined;
  }

  return { plan, subscriberBandCeiling: ceilings[0] ?? null };
};
