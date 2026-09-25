import type { ValidationContext } from 'sanity';

const COMPARE_AT_MUST_EXCEED_AMOUNT_MESSAGE =
  'The compare-at amount must be greater than the amount.';

type TPricingPriceParent = { amount?: number };

export const validatePricingCompareAtAboveAmount = (
  compareAtAmount: number | undefined,
  context: ValidationContext,
): string | true => {
  if (compareAtAmount === undefined) return true;

  const parent = context.parent as TPricingPriceParent | undefined;

  if (parent?.amount === undefined) return true;

  return compareAtAmount > parent.amount
    ? true
    : COMPARE_AT_MUST_EXCEED_AMOUNT_MESSAGE;
};
