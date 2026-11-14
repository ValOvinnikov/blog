import { STRIPE_COUPON_DURATION } from '@blog/db/constants';
import { fromStripeTime } from '@platform/server/billing/stripe-time';
import {
  MOCK_DOLLAR_AMOUNT,
  MOCK_EURO_AMOUNT,
  MOCK_EURO_CURRENCY,
  MOCK_PERCENT_OFF,
  MOCK_STRIPE_PRODUCT_ID,
  MOCK_UNSUPPORTED_CURRENCY,
  mockStripeCataloguePromotionCode,
  mockStripeCoupon,
} from '@platform/testing/billing/catalogue';
import {
  MOCK_STRIPE_CURRENCY,
  MOCK_STRIPE_PROMOTION_CODE,
  MOCK_STRIPE_PROMOTION_CODE_ID,
} from '@platform/testing/billing/fixtures';

import { toCataloguePromotionCode } from './to-catalogue-promotion-code';

const MOCK_EARLIER_SECONDS = 1_800_000_000;
const MOCK_LATER_SECONDS = MOCK_EARLIER_SECONDS + 1;
const MOCK_MONTHS = 3;

describe(toCataloguePromotionCode, () => {
  it('stores a public percent-off code', () => {
    expect(
      toCataloguePromotionCode(mockStripeCataloguePromotionCode()),
    ).toEqual({
      promotionCodeId: MOCK_STRIPE_PROMOTION_CODE_ID,
      code: MOCK_STRIPE_PROMOTION_CODE,
      percentOff: MOCK_PERCENT_OFF,
      amountOffByCurrency: undefined,
      duration: STRIPE_COUPON_DURATION.FOREVER,
      durationInMonths: undefined,
      appliesToProductIds: undefined,
      expiresAt: undefined,
    });
  });

  it('keeps an amount-off per billing currency, the duration and the products', () => {
    const coupon = mockStripeCoupon({
      percent_off: null,
      amount_off: MOCK_DOLLAR_AMOUNT,
      currency: MOCK_STRIPE_CURRENCY,
      currency_options: {
        [MOCK_EURO_CURRENCY]: { amount_off: MOCK_EURO_AMOUNT },
        [MOCK_UNSUPPORTED_CURRENCY]: { amount_off: MOCK_EURO_AMOUNT },
      },
      duration: 'repeating',
      duration_in_months: MOCK_MONTHS,
      applies_to: { products: [MOCK_STRIPE_PRODUCT_ID] },
    });

    expect(
      toCataloguePromotionCode(mockStripeCataloguePromotionCode({}, coupon)),
    ).toMatchObject({
      percentOff: undefined,
      amountOffByCurrency: { EUR: MOCK_EURO_AMOUNT, USD: MOCK_DOLLAR_AMOUNT },
      duration: STRIPE_COUPON_DURATION.REPEATING,
      durationInMonths: MOCK_MONTHS,
      appliesToProductIds: [MOCK_STRIPE_PRODUCT_ID],
    });
  });

  it('leaves out an amount-off code with no billing currency', () => {
    const coupon = mockStripeCoupon({
      percent_off: null,
      amount_off: MOCK_DOLLAR_AMOUNT,
      currency: MOCK_UNSUPPORTED_CURRENCY,
    });

    expect(
      toCataloguePromotionCode(mockStripeCataloguePromotionCode({}, coupon)),
    ).toBeUndefined();
  });

  it('expires at the earlier of the code expiry and the coupon redeem-by', () => {
    const promotionCode = mockStripeCataloguePromotionCode(
      { expires_at: MOCK_LATER_SECONDS },
      mockStripeCoupon({ redeem_by: MOCK_EARLIER_SECONDS }),
    );

    expect(toCataloguePromotionCode(promotionCode)?.expiresAt).toEqual(
      fromStripeTime(MOCK_EARLIER_SECONDS),
    );
  });

  it.each([
    ['an inactive code', { active: false }],
    ['a code for one customer', { customer: MOCK_STRIPE_PRODUCT_ID }],
    ['a code past its redemptions', { max_redemptions: 1, times_redeemed: 1 }],
    [
      'a code for first-time buyers',
      { restrictions: { first_time_transaction: true, minimum_amount: null } },
    ],
    [
      'a code with a minimum amount',
      {
        restrictions: {
          first_time_transaction: false,
          minimum_amount: MOCK_DOLLAR_AMOUNT,
        },
      },
    ],
  ])('leaves out %s', (_description, overrides) => {
    expect(
      toCataloguePromotionCode(
        mockStripeCataloguePromotionCode(overrides as object),
      ),
    ).toBeUndefined();
  });

  it('leaves out a code whose coupon is no longer valid', () => {
    expect(
      toCataloguePromotionCode(
        mockStripeCataloguePromotionCode(
          {},
          mockStripeCoupon({ valid: false }),
        ),
      ),
    ).toBeUndefined();
  });
});
