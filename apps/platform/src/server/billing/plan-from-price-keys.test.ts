import { TENANT_PLAN } from '@blog/config/constants';
import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { BILLING_INTERVAL } from '@platform/constants/billing';
import { MOCK_BAND_CEILING } from '@platform/testing/billing/fixtures';

import {
  bandKeyFor,
  planFromPriceKeys,
  pricesFromKeys,
} from './plan-from-price-keys';

describe(planFromPriceKeys, () => {
  it.each([
    [STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY, TENANT_PLAN.STARTER],
    [STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY, TENANT_PLAN.STARTER],
    [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY, TENANT_PLAN.GROWTH],
    [STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY, TENANT_PLAN.GROWTH],
  ])('maps %s to %s with the included band', (key, plan) => {
    expect(planFromPriceKeys([key])).toEqual({
      plan,
      subscriberBandCeiling: null,
    });
  });

  it.each([
    [
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000,
      5_000,
    ],
    [
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_25000_YEARLY,
      25_000,
    ],
  ])('reads the band from %s with %s', (planKey, bandKey, ceiling) => {
    expect(planFromPriceKeys([planKey, bandKey])).toEqual({
      plan: TENANT_PLAN.GROWTH,
      subscriberBandCeiling: ceiling,
    });
  });

  it.each([
    [
      'an unknown key',
      [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY, 'SOMETHING_ELSE'],
    ],
    [
      'a price with no lookup key',
      [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY, null],
    ],
    ['no plan price', [STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500]],
    [
      'two plan prices',
      [
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
        STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
      ],
    ],
    [
      'two band prices',
      [
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000,
      ],
    ],
  ])('refuses a subscription with %s', (_case, keys) => {
    expect(planFromPriceKeys(keys)).toBeUndefined();
  });
});

describe(pricesFromKeys, () => {
  it.each([
    [STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY, BILLING_INTERVAL.MONTHLY],
    [STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY, BILLING_INTERVAL.YEARLY],
  ])('reads the billing period from %s', (key, interval) => {
    expect(pricesFromKeys([key])).toEqual({
      plan: TENANT_PLAN.STARTER,
      interval,
      subscriberBandCeiling: null,
    });
  });
});

describe(bandKeyFor, () => {
  it('names the band Price for the period on a plan with bands', () => {
    expect(
      bandKeyFor(
        TENANT_PLAN.GROWTH,
        BILLING_INTERVAL.YEARLY,
        MOCK_BAND_CEILING,
      ),
    ).toBe(STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY);
  });

  it.each([
    ['a plan without bands', TENANT_PLAN.STARTER, MOCK_BAND_CEILING],
    ['the included band', TENANT_PLAN.GROWTH, null],
  ])('names none for %s', (_case, plan, ceiling) => {
    expect(bandKeyFor(plan, BILLING_INTERVAL.MONTHLY, ceiling)).toBeUndefined();
  });
});
