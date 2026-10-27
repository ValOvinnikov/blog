import { validatePricingCompareAtAboveAmount } from '@blog/studio/schema-types/validation/validate-pricing-compare-at-above-amount/validate-pricing-compare-at-above-amount';
import { faker } from '@faker-js/faker';
import type { ValidationContext } from 'sanity';

faker.seed(6022);

const COMPARE_AT_MUST_EXCEED_AMOUNT_MESSAGE =
  'The compare-at amount must be greater than the amount.';

const MOCK_AMOUNT = faker.number.int({ min: 10, max: 100 });

const contextWithAmount = (amount?: number): ValidationContext =>
  ({ parent: { amount } }) as unknown as ValidationContext;

describe(validatePricingCompareAtAboveAmount, () => {
  it.each([
    ['passes when no compare-at amount is set', undefined, MOCK_AMOUNT, true],
    ['passes when the price has no amount yet', MOCK_AMOUNT, undefined, true],
    [
      'passes when the compare-at amount exceeds the amount',
      MOCK_AMOUNT + 1,
      MOCK_AMOUNT,
      true,
    ],
    [
      'fails when the compare-at amount equals the amount',
      MOCK_AMOUNT,
      MOCK_AMOUNT,
      COMPARE_AT_MUST_EXCEED_AMOUNT_MESSAGE,
    ],
    [
      'fails when the compare-at amount is below the amount',
      MOCK_AMOUNT - 1,
      MOCK_AMOUNT,
      COMPARE_AT_MUST_EXCEED_AMOUNT_MESSAGE,
    ],
  ])('%s', (_description, compareAtAmount, amount, expected) => {
    expect(
      validatePricingCompareAtAboveAmount(
        compareAtAmount,
        contextWithAmount(amount),
      ),
    ).toBe(expected);
  });
});
