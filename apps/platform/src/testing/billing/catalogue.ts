import { BILLING_CURRENCY, STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import {
  MOCK_STRIPE_CURRENCY,
  MOCK_STRIPE_PRICE_ID,
  MOCK_STRIPE_PROMOTION_CODE,
  MOCK_STRIPE_PROMOTION_CODE_ID,
} from '@platform/testing/billing/fixtures';
import { createMockFaker } from '@platform/testing/mock-faker';
import type Stripe from 'stripe';

const catalogueFaker = createMockFaker(6882);

export const MOCK_STRIPE_PRODUCT_ID = `prod_${catalogueFaker.string.alphanumeric(14)}`;
export const MOCK_STRIPE_COUPON_ID = catalogueFaker.string.alphanumeric(8);
export const MOCK_DOLLAR_AMOUNT = catalogueFaker.number.int({
  min: 500,
  max: 5000,
});
export const MOCK_EURO_AMOUNT = catalogueFaker.number.int({
  min: 500,
  max: 5000,
});
export const MOCK_PERCENT_OFF = catalogueFaker.number.int({ min: 5, max: 50 });
export const MOCK_UNSUPPORTED_CURRENCY = 'jpy';
export const MOCK_UNKNOWN_LOOKUP_KEY = catalogueFaker.string.alpha({
  length: 10,
  casing: 'upper',
});
export const MOCK_EURO_CURRENCY = BILLING_CURRENCY.EUR.toLowerCase();

export const mockStripeCataloguePrice = (
  overrides: Partial<Stripe.Price> = {},
): Stripe.Price =>
  ({
    id: MOCK_STRIPE_PRICE_ID,
    active: true,
    lookup_key: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    product: MOCK_STRIPE_PRODUCT_ID,
    currency: MOCK_STRIPE_CURRENCY,
    unit_amount: MOCK_DOLLAR_AMOUNT,
    currency_options: {
      [MOCK_EURO_CURRENCY]: { unit_amount: MOCK_EURO_AMOUNT },
      [MOCK_UNSUPPORTED_CURRENCY]: { unit_amount: MOCK_EURO_AMOUNT },
    },
    ...overrides,
  }) as unknown as Stripe.Price;

export const mockStripeCoupon = (
  overrides: Partial<Stripe.Coupon> = {},
): Stripe.Coupon =>
  ({
    id: MOCK_STRIPE_COUPON_ID,
    valid: true,
    percent_off: MOCK_PERCENT_OFF,
    amount_off: null,
    currency: null,
    currency_options: undefined,
    duration: 'forever',
    duration_in_months: null,
    redeem_by: null,
    applies_to: undefined,
    ...overrides,
  }) as unknown as Stripe.Coupon;

export const mockStripeCataloguePromotionCode = (
  overrides: Partial<Stripe.PromotionCode> = {},
  coupon: Stripe.Coupon = mockStripeCoupon(),
): Stripe.PromotionCode =>
  ({
    id: MOCK_STRIPE_PROMOTION_CODE_ID,
    code: MOCK_STRIPE_PROMOTION_CODE,
    active: true,
    customer: null,
    expires_at: null,
    max_redemptions: null,
    times_redeemed: 0,
    restrictions: { first_time_transaction: false, minimum_amount: null },
    promotion: { type: 'coupon', coupon },
    ...overrides,
  }) as unknown as Stripe.PromotionCode;
