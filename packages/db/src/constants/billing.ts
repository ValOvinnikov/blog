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
  GROWTH_BAND_2500_YEARLY: 'GROWTH_BAND_2500_YEARLY',
  GROWTH_BAND_5000_YEARLY: 'GROWTH_BAND_5000_YEARLY',
  GROWTH_BAND_10000_YEARLY: 'GROWTH_BAND_10000_YEARLY',
  GROWTH_BAND_25000_YEARLY: 'GROWTH_BAND_25000_YEARLY',
} as const;

export type TStripePriceLookupKey = TValueOf<typeof STRIPE_PRICE_LOOKUP_KEY>;

export type TSubscriberBandCeiling = (typeof SUBSCRIBER_BAND_CEILINGS)[number];

export type TPaidSubscriberBandCeiling = Exclude<
  TSubscriberBandCeiling,
  (typeof SUBSCRIBER_BAND_CEILINGS)[0]
>;

export type TIntervalPriceLookupKeys = {
  monthly: TStripePriceLookupKey;
  yearly: TStripePriceLookupKey;
};

export type TPlanPriceLookupKeys = TIntervalPriceLookupKeys & {
  subscriberBands?: Record<
    TPaidSubscriberBandCeiling,
    TIntervalPriceLookupKeys
  >;
};

// Stripe lookup keys, never Price ids: one key names the same Price in test and live mode.
export const PLAN_PRICE_LOOKUP_KEYS: Record<
  TTenantPlan,
  TMaybeNull<TPlanPriceLookupKeys>
> = {
  [TENANT_PLAN.FREE]: null,
  [TENANT_PLAN.STARTER]: {
    monthly: STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
    yearly: STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY,
  },
  [TENANT_PLAN.GROWTH]: {
    monthly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    yearly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
    subscriberBands: {
      2_500: {
        monthly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
        yearly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY,
      },
      5_000: {
        monthly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000,
        yearly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000_YEARLY,
      },
      10_000: {
        monthly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_10000,
        yearly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_10000_YEARLY,
      },
      25_000: {
        monthly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_25000,
        yearly: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_25000_YEARLY,
      },
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

export const STRIPE_TENANT_LOOKUP_OUTCOME = {
  FOUND: 'FOUND',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
} as const;

export type TStripeTenantLookupOutcome = TValueOf<
  typeof STRIPE_TENANT_LOOKUP_OUTCOME
>;
