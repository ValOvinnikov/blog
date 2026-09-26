import { validatePricingCompareAtAboveAmount } from '@blog/studio/schema-types/validation/validate-pricing-compare-at-above-amount/validate-pricing-compare-at-above-amount';
import type { ValidationContext } from 'sanity';

const COMPARE_AT_MUST_EXCEED_AMOUNT_MESSAGE =
  'The compare-at amount must be greater than the amount.';

const buildContext = (amount?: number): ValidationContext =>
  ({ parent: { amount } }) as unknown as ValidationContext;

describe(validatePricingCompareAtAboveAmount, () => {
  it.each([
    ['no compareAtAmount is set', undefined, undefined],
    ['the parent has no amount yet', undefined, 40],
    ['compareAtAmount exceeds amount', 50, 40],
  ])('passes when %s', (_description, compareAtAmount, amount) => {
    expect(
      validatePricingCompareAtAboveAmount(
        compareAtAmount,
        buildContext(amount),
      ),
    ).toBe(true);
  });

  it('fails with the exceeds-amount message when compareAtAmount is equal to amount', () => {
    expect(validatePricingCompareAtAboveAmount(40, buildContext(40))).toBe(
      COMPARE_AT_MUST_EXCEED_AMOUNT_MESSAGE,
    );
  });

  it('fails with the exceeds-amount message when compareAtAmount is below amount', () => {
    expect(validatePricingCompareAtAboveAmount(30, buildContext(40))).toBe(
      COMPARE_AT_MUST_EXCEED_AMOUNT_MESSAGE,
    );
  });
});
