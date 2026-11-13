import { saveStripePromotionCode } from '@blog/db/queries/stripe-catalogue/save-stripe-promotion-code';
import * as schema from '@blog/db/schema';
import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_PROMOTION_CODE,
  mockSaveStripePromotionCodeInput,
} from '@blog/db/testing/stripe-catalogue/fixtures';

import { getActiveStripePromotionCode } from './get-active-stripe-promotion-code';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_LATER = new Date(MOCK_NOW.getTime() + 1);
const MOCK_EARLIER = new Date(MOCK_NOW.getTime() - 1);

afterEach(async () => {
  await db().delete(schema.stripePromotionCodes);
});

describe(getActiveStripePromotionCode, () => {
  it('returns nothing for an unknown code', async () => {
    expect(
      await getActiveStripePromotionCode(MOCK_PROMOTION_CODE, MOCK_NOW),
    ).toBeUndefined();
  });

  it.each([
    ['finds a code with no expiry, whatever its case', undefined, true],
    ['finds a code that has not expired yet', MOCK_LATER, true],
    ['ignores a code that has expired', MOCK_EARLIER, false],
  ])('%s', async (_description, expiresAt, isFound) => {
    await saveStripePromotionCode(
      mockSaveStripePromotionCodeInput({ expiresAt }),
    );

    const promotionCode = await getActiveStripePromotionCode(
      ` ${MOCK_PROMOTION_CODE.toLowerCase()} `,
      MOCK_NOW,
    );

    expect(Boolean(promotionCode)).toBe(isFound);
  });
});
