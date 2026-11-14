import { PRICE_PERIOD } from '@blog/config';
import {
  BILLING_CURRENCY,
  STRIPE_COUPON_DURATION,
  STRIPE_PRICE_LOOKUP_KEY,
} from '@blog/db/constants';
import type { TStripePrice } from '@blog/db/queries/stripe-catalogue/list-stripe-prices';
import {
  MOCK_DOLLAR_AMOUNT,
  MOCK_EURO_AMOUNT,
  MOCK_PROMOTION_CODE,
  MOCK_STRIPE_PRODUCT_ID,
} from '@blog/db/testing/stripe-catalogue/fixtures';
import { MOCK_PRICING_LABELS } from '@web/testing/modules/pricing/fixtures';
import type { TPromotionDiscount } from '@web/utils/promotion-discount';
import type { ILivePlanPrice } from '@web/utils/to-live-plan-price';

export const mockStripePrice = (
  overrides: Partial<TStripePrice> = {},
): TStripePrice => ({
  lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
  currency: BILLING_CURRENCY.USD,
  unitAmount: MOCK_DOLLAR_AMOUNT,
  stripeProductId: MOCK_STRIPE_PRODUCT_ID,
  ...overrides,
});

export const mockLivePlanPrice = (
  overrides: Partial<ILivePlanPrice> = {},
): ILivePlanPrice => ({
  period: MOCK_PRICING_LABELS.periods[PRICE_PERIOD.MONTH],
  defaultCurrency: BILLING_CURRENCY.USD,
  amounts: {
    [BILLING_CURRENCY.USD]: {
      unitAmount: MOCK_DOLLAR_AMOUNT,
      productId: MOCK_STRIPE_PRODUCT_ID,
    },
    [BILLING_CURRENCY.EUR]: {
      unitAmount: MOCK_EURO_AMOUNT,
      productId: MOCK_STRIPE_PRODUCT_ID,
    },
  },
  ...overrides,
});

export const mockPromotionDiscount = (
  overrides: Partial<TPromotionDiscount> = {},
): TPromotionDiscount => ({
  code: MOCK_PROMOTION_CODE,
  percentOff: undefined,
  amountOffByCurrency: undefined,
  duration: STRIPE_COUPON_DURATION.FOREVER,
  durationInMonths: undefined,
  appliesToProductIds: undefined,
  ...overrides,
});
