import { getActiveStripePromotionCode } from '@blog/db/queries/stripe-catalogue/get-active-stripe-promotion-code';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
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
      appliesToProductIds: undefined,
      expiresAt: undefined,
    });
  });

  it('updates a code saved again under the same id', async () => {
    await saveStripePromotionCode(mockSaveStripePromotionCodeInput());
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
