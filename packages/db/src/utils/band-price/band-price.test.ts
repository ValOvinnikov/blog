import { BILLING_INTERVAL, TENANT_PLAN } from '@shinefold/config/constants';
import {
  BILLING_CURRENCY,
  STRIPE_PRICE_LOOKUP_KEY,
} from '@shinefold/db/constants';
import { mockStripePrice } from '@shinefold/db/testing/stripe-catalogue/fixtures';

import { bandAmountOf, bandMoveUpFor, catalogueAmountOf } from './band-price';

const MOCK_BAND_2500_AMOUNT = 1_500;
const MOCK_BAND_5000_AMOUNT = 3_500;
const MOCK_BAND_25000_AMOUNT = 9_900;
const MOCK_PRICING = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.MONTHLY,
  currency: BILLING_CURRENCY.EUR,
};
const MOCK_PRICES = [
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
    currency: BILLING_CURRENCY.EUR,
    unitAmount: MOCK_BAND_2500_AMOUNT,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000,
    currency: BILLING_CURRENCY.EUR,
    unitAmount: MOCK_BAND_5000_AMOUNT,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_25000,
    currency: BILLING_CURRENCY.EUR,
    unitAmount: MOCK_BAND_25000_AMOUNT,
  }),
];

describe(catalogueAmountOf, () => {
  it('reads a price only in the asked currency', () => {
    expect(
      catalogueAmountOf(
        MOCK_PRICES,
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
        BILLING_CURRENCY.USD,
      ),
    ).toBeUndefined();
  });
});

describe(bandAmountOf, () => {
  it('costs nothing for the included band', () => {
    expect(bandAmountOf(MOCK_PRICES, MOCK_PRICING, null)).toBe(0);
  });
});

describe(bandMoveUpFor, () => {
  it('offers the next band at the difference from the current one', () => {
    expect(bandMoveUpFor(MOCK_PRICES, MOCK_PRICING, 2_500)).toEqual({
      ceiling: 5_000,
      extraMinorUnits: MOCK_BAND_5000_AMOUNT - MOCK_BAND_2500_AMOUNT,
    });
  });

  it('offers the first paid band in full from the included one', () => {
    expect(bandMoveUpFor(MOCK_PRICES, MOCK_PRICING, null)).toEqual({
      ceiling: 2_500,
      extraMinorUnits: MOCK_BAND_2500_AMOUNT,
    });
  });

  it.each([
    ['the largest band', 25_000 as const],
    ['a next band with no price in the catalogue', 5_000 as const],
  ])('offers nothing from %s', (_, ceiling) => {
    expect(bandMoveUpFor(MOCK_PRICES, MOCK_PRICING, ceiling)).toBeUndefined();
  });
});
