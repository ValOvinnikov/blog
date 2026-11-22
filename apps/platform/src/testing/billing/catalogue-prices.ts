import { STRIPE_PRICE_LOOKUP_KEY } from '@shinefold/db/constants';
import type { TStripePrice } from '@shinefold/db/queries/stripe-catalogue/list-stripe-prices';
import { mockStripePrice } from '@shinefold/db/testing/stripe-catalogue/fixtures';

export const MOCK_GROWTH_MONTHLY_AMOUNT = 2_900;
export const MOCK_BAND_2500_AMOUNT = 1_500;
export const MOCK_BAND_5000_AMOUNT = 3_500;
const MOCK_GROWTH_YEARLY_AMOUNT = 29_000;
export const MOCK_BAND_2500_YEARLY_AMOUNT = 15_000;

export const MOCK_GROWTH_CATALOGUE: TStripePrice[] = [
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    unitAmount: MOCK_GROWTH_MONTHLY_AMOUNT,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
    unitAmount: MOCK_BAND_2500_AMOUNT,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000,
    unitAmount: MOCK_BAND_5000_AMOUNT,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
    unitAmount: MOCK_GROWTH_YEARLY_AMOUNT,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY,
    unitAmount: MOCK_BAND_2500_YEARLY_AMOUNT,
  }),
];
