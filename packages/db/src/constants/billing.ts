import {
  TENANT_PLAN,
  type TSellableTenantPlan,
  type TTenantPlan,
} from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';

import { SUBSCRIBER_BAND_CEILINGS } from './tenant';

export const TRIAL_LENGTH_DAYS = 14;

export const BILLING_CURRENCY = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
} as const;

export type TBillingCurrency = TValueOf<typeof BILLING_CURRENCY>;

export const STRIPE_COUPON_DURATION = {
  ONCE: 'ONCE',
  REPEATING: 'REPEATING',
  FOREVER: 'FOREVER',
} as const;

export type TStripeCouponDuration = TValueOf<typeof STRIPE_COUPON_DURATION>;

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

function isPaidSubscriberBandCeiling(
  ceiling: TSubscriberBandCeiling,
): ceiling is TPaidSubscriberBandCeiling {
  return ceiling !== SUBSCRIBER_BAND_CEILINGS[0];
}

export const PAID_SUBSCRIBER_BAND_CEILINGS = SUBSCRIBER_BAND_CEILINGS.filter(
  isPaidSubscriberBandCeiling,
);

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

type TPlanPriceLookupKeysByPlan = {
  [P in TTenantPlan]: P extends TSellableTenantPlan
    ? TPlanPriceLookupKeys
    : null;
};

// Stripe lookup keys, never Price ids: one key names the same Price in test and live mode.
export const PLAN_PRICE_LOOKUP_KEYS: TPlanPriceLookupKeysByPlan = {
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

export const TENANT_PLAN_WRITE_OUTCOME = {
  WRITTEN: 'WRITTEN',
  NOT_WRITABLE: 'NOT_WRITABLE',
  NOT_FOUND: 'NOT_FOUND',
} as const;
