import type { TMaybeNull } from '@blog/config/types';
import type { TValueOf } from '@blog/config/utils';

import {
  type SUBSCRIBER_BAND_CEILINGS,
  TENANT_PLAN,
  type TTenantPlan,
} from './tenant';

export const STRIPE_PRICE_LOOKUP_KEY = {
  STARTER_MONTHLY: 'STARTER_MONTHLY',
  STARTER_YEARLY: 'STARTER_YEARLY',
  GROWTH_MONTHLY: 'GROWTH_MONTHLY',
  GROWTH_YEARLY: 'GROWTH_YEARLY',
  GROWTH_BAND_2500: 'GROWTH_BAND_2500',
  GROWTH_BAND_5000: 'GROWTH_BAND_5000',
  GROWTH_BAND_10000: 'GROWTH_BAND_10000',
  GROWTH_BAND_25000: 'GROWTH_BAND_25000',
} as const;

export type TStripePriceLookupKey = TValueOf<typeof STRIPE_PRICE_LOOKUP_KEY>;

export type TSubscriberBandCeiling = (typeof SUBSCRIBER_BAND_CEILINGS)[number];

export type TPlanPriceLookupKeys = {
  monthly: TStripePriceLookupKey;
  yearly: TStripePriceLookupKey;
  subscriberBands: Partial<
    Record<TSubscriberBandCeiling, TStripePriceLookupKey>
  >;
};

// Lookup keys, not Price ids: a key names the same Price in Stripe's test and
// live modes, and moves to a new Price when an amount changes.
export const PLAN_PRICE_LOOKUP_KEYS: Record<
  TTenantPlan,
  TMaybeNull<TPlanPriceLookupKeys>
> = {
  [TENANT_PLAN.FREE]: null,
  [TENANT_PLAN.STARTER]: {
    monthly: STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
    yearly: STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY,
    subscriberBands: {},
  },
  [TENANT_PLAN.GROWTH]: {
    monthly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    yearly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
    subscriberBands: {
      2_500: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
      5_000: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000,
      10_000: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_10000,
      25_000: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_25000,
    },
  },
};

export const STRIPE_EVENT_RECORD_OUTCOME = {
  RECORDED: 'RECORDED',
  ALREADY_HANDLED: 'ALREADY_HANDLED',
} as const;

export type TStripeEventRecordOutcome = TValueOf<
  typeof STRIPE_EVENT_RECORD_OUTCOME
>;
