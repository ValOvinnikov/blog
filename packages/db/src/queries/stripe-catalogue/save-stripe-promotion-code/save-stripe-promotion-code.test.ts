import { STRIPE_COUPON_DURATION } from '@blog/db/constants';
import { getActiveStripePromotionCode } from '@blog/db/queries/stripe-catalogue/get-active-stripe-promotion-code';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_DURATION_IN_MONTHS,
  MOCK_OTHER_PROMOTION_CODE_ID,
  MOCK_PERCENT_OFF,
  MOCK_PROMOTION_CODE,
  MOCK_STRIPE_PRODUCT_ID,
  mockSaveStripePromotionCodeInput,
} from '@blog/db/testing/stripe-catalogue/fixtures';

import { saveStripePromotionCode } from './save-stripe-promotion-code';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.stripePromotionCodes);
});

describe(saveStripePromotionCode, () => {
  describe('with a saved code', () => {
    beforeEach(async () => {
      await saveStripePromotionCode(mockSaveStripePromotionCodeInput());
    });

    it('replaces an older promotion code that reused the same code string', async () => {
      await saveStripePromotionCode(
        mockSaveStripePromotionCodeInput({
          promotionCodeId: MOCK_OTHER_PROMOTION_CODE_ID,
          duration: STRIPE_COUPON_DURATION.REPEATING,
          durationInMonths: MOCK_DURATION_IN_MONTHS,
        }),
      );

      expect(await getActiveStripePromotionCode(MOCK_PROMOTION_CODE)).toEqual(
        expect.objectContaining({
          duration: STRIPE_COUPON_DURATION.REPEATING,
          durationInMonths: MOCK_DURATION_IN_MONTHS,
        }),
      );
    });

    it('updates a code saved again under the same id', async () => {
      await saveStripePromotionCode(
        mockSaveStripePromotionCodeInput({
          appliesToProductIds: [MOCK_STRIPE_PRODUCT_ID],
        }),
      );

      expect(await getActiveStripePromotionCode(MOCK_PROMOTION_CODE)).toEqual(
        expect.objectContaining({
          appliesToProductIds: [MOCK_STRIPE_PRODUCT_ID],
        }),
      );
    });
  });

  it('stores the code in upper case with its discount', async () => {
    await saveStripePromotionCode(
      mockSaveStripePromotionCodeInput({
        code: MOCK_PROMOTION_CODE.toLowerCase(),
      }),
    );

    expect(await getActiveStripePromotionCode(MOCK_PROMOTION_CODE)).toEqual({
      code: MOCK_PROMOTION_CODE,
      percentOff: MOCK_PERCENT_OFF,
      amountOffByCurrency: undefined,
      duration: STRIPE_COUPON_DURATION.FOREVER,
      durationInMonths: undefined,
      appliesToProductIds: undefined,
      expiresAt: undefined,
    });
  });
});
