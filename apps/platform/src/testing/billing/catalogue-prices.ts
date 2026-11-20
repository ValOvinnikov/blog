import {
  BILLING_CURRENCY,
  STRIPE_PRICE_LOOKUP_KEY,
  type TBillingCurrency,
  type TStripePriceLookupKey,
} from '@shinefold/db/constants';
import type { TStripePrice } from '@shinefold/db/queries/stripe-catalogue/list-stripe-prices';
import { MOCK_STRIPE_PRODUCT_ID } from '@shinefold/db/testing/stripe-catalogue/fixtures';

export const MOCK_GROWTH_MONTHLY_AMOUNT = 2_900;
export const MOCK_BAND_2500_AMOUNT = 1_500;
export const MOCK_BAND_5000_AMOUNT = 3_500;
export const MOCK_GROWTH_YEARLY_AMOUNT = 29_000;
export const MOCK_BAND_2500_YEARLY_AMOUNT = 15_000;

const mockCataloguePrice = (
  lookupKey: TStripePriceLookupKey,
  unitAmount: number,
  currency: TBillingCurrency = BILLING_CURRENCY.USD,
): TStripePrice => ({
  lookupKey,
  currency,
  unitAmount,
  stripeProductId: MOCK_STRIPE_PRODUCT_ID,
});

export const MOCK_GROWTH_CATALOGUE: TStripePrice[] = [
  mockCataloguePrice(
    STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    MOCK_GROWTH_MONTHLY_AMOUNT,
  ),
  mockCataloguePrice(
    STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
    MOCK_BAND_2500_AMOUNT,
  ),
  mockCataloguePrice(
    STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000,
    MOCK_BAND_5000_AMOUNT,
  ),
  mockCataloguePrice(
    STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
    MOCK_GROWTH_YEARLY_AMOUNT,
  ),
  mockCataloguePrice(
    STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY,
    MOCK_BAND_2500_YEARLY_AMOUNT,
  ),
];
