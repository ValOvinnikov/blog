import type { ValidationContext } from 'sanity';

const PRICE_LABEL_REQUIRED_MESSAGE = 'Add a label when the tier has no prices.';

type TPricingTierParent = { prices?: unknown[] };

export const validatePricingTierPriceLabelRequired = (
  priceLabel: string | undefined,
  context: ValidationContext,
): string | true => {
  const parent = context.parent as TPricingTierParent | undefined;
  const hasPrices = (parent?.prices?.length ?? 0) > 0;

  return !hasPrices && !priceLabel ? PRICE_LABEL_REQUIRED_MESSAGE : true;
};
