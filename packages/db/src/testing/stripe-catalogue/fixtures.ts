import { BILLING_CURRENCY, STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import type { TSaveStripePriceInput } from '@blog/db/queries/stripe-catalogue/save-stripe-price';
import type { TSaveStripePromotionCodeInput } from '@blog/db/queries/stripe-catalogue/save-stripe-promotion-code';
import { createMockFaker } from '@blog/db/testing/mock-faker';

const catalogueFaker = createMockFaker(6882);

export const MOCK_STRIPE_PRICE_ID = `price_${catalogueFaker.string.alphanumeric(14)}`;
export const MOCK_OTHER_STRIPE_PRICE_ID = `price_${catalogueFaker.string.alphanumeric(14)}`;
export const MOCK_STRIPE_PRODUCT_ID = `prod_${catalogueFaker.string.alphanumeric(14)}`;
export const MOCK_DOLLAR_AMOUNT = catalogueFaker.number.int({
  min: 500,
  max: 5000,
});
export const MOCK_EURO_AMOUNT = catalogueFaker.number.int({
  min: 500,
  max: 5000,
});
export const MOCK_PROMOTION_CODE_ID = `promo_${catalogueFaker.string.alphanumeric(14)}`;
export const MOCK_PROMOTION_CODE = catalogueFaker.string.alpha({
  length: 8,
  casing: 'upper',
});
export const MOCK_PERCENT_OFF = catalogueFaker.number.int({ min: 5, max: 50 });

export function mockSaveStripePriceInput(
  overrides: Partial<TSaveStripePriceInput> = {},
): TSaveStripePriceInput {
  return {
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    stripePriceId: MOCK_STRIPE_PRICE_ID,
    stripeProductId: MOCK_STRIPE_PRODUCT_ID,
    amounts: [
      { currency: BILLING_CURRENCY.USD, unitAmount: MOCK_DOLLAR_AMOUNT },
      { currency: BILLING_CURRENCY.EUR, unitAmount: MOCK_EURO_AMOUNT },
    ],
    ...overrides,
  };
}

export function mockSaveStripePromotionCodeInput(
  overrides: Partial<TSaveStripePromotionCodeInput> = {},
): TSaveStripePromotionCodeInput {
  return {
    promotionCodeId: MOCK_PROMOTION_CODE_ID,
    code: MOCK_PROMOTION_CODE,
    percentOff: MOCK_PERCENT_OFF,
    amountOffByCurrency: undefined,
    appliesToProductIds: undefined,
    expiresAt: undefined,
    ...overrides,
  };
}
