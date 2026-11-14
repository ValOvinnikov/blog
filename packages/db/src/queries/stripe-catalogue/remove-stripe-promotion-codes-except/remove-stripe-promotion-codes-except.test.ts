import { saveStripePromotionCode } from '@blog/db/queries/stripe-catalogue/save-stripe-promotion-code';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_OTHER_PROMOTION_CODE,
  MOCK_OTHER_PROMOTION_CODE_ID,
  MOCK_PROMOTION_CODE_ID,
  mockSaveStripePromotionCodeInput,
} from '@blog/db/testing/stripe-catalogue/fixtures';

import { removeStripePromotionCodesExcept } from './remove-stripe-promotion-codes-except';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

async function storedPromotionCodeIds(): Promise<Set<string>> {
  const rows = await db()
    .select({ promotionCodeId: schema.stripePromotionCodes.promotionCodeId })
    .from(schema.stripePromotionCodes);
  return new Set(rows.map(({ promotionCodeId }) => promotionCodeId));
}

afterEach(async () => {
  await db().delete(schema.stripePromotionCodes);
});

describe(removeStripePromotionCodesExcept, () => {
  beforeEach(async () => {
    await saveStripePromotionCode(mockSaveStripePromotionCodeInput());
    await saveStripePromotionCode(
      mockSaveStripePromotionCodeInput({
        promotionCodeId: MOCK_OTHER_PROMOTION_CODE_ID,
        code: MOCK_OTHER_PROMOTION_CODE,
      }),
    );
  });

  it('keeps the given promotion codes and removes the rest', async () => {
    await removeStripePromotionCodesExcept([MOCK_OTHER_PROMOTION_CODE_ID]);

    expect(await storedPromotionCodeIds()).toEqual(
      new Set([MOCK_OTHER_PROMOTION_CODE_ID]),
    );
  });

  it('removes every promotion code when none is kept', async () => {
    await removeStripePromotionCodesExcept([]);

    expect(await storedPromotionCodeIds()).toEqual(new Set());
  });

  it('removes nothing when every promotion code is kept', async () => {
    await removeStripePromotionCodesExcept([
      MOCK_PROMOTION_CODE_ID,
      MOCK_OTHER_PROMOTION_CODE_ID,
    ]);

    expect(await storedPromotionCodeIds()).toEqual(
      new Set([MOCK_PROMOTION_CODE_ID, MOCK_OTHER_PROMOTION_CODE_ID]),
    );
  });
});
