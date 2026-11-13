import { getActiveStripePromotionCode } from '@blog/db/queries/stripe-catalogue/get-active-stripe-promotion-code';
import { saveStripePromotionCode } from '@blog/db/queries/stripe-catalogue/save-stripe-promotion-code';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_PROMOTION_CODE,
  MOCK_PROMOTION_CODE_ID,
  mockSaveStripePromotionCodeInput,
} from '@blog/db/testing/stripe-catalogue/fixtures';

import { removeStripePromotionCode } from './remove-stripe-promotion-code';

vi.mock('@blog/db/client');

useQueryTestDb();

describe(removeStripePromotionCode, () => {
  it('removes the code so it no longer applies', async () => {
    await saveStripePromotionCode(mockSaveStripePromotionCodeInput());

    await removeStripePromotionCode(MOCK_PROMOTION_CODE_ID);

    expect(
      await getActiveStripePromotionCode(MOCK_PROMOTION_CODE),
    ).toBeUndefined();
  });
});
