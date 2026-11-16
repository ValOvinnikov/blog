import type { TMaybeUndefined } from '@shinefold/config/types';
import { defaultLanguageValue } from '@shinefold/studio/schema-types/validation/default-language-value/default-language-value';
import { isPricingTierLinked } from '@shinefold/studio/schema-types/validation/is-pricing-tier-linked/is-pricing-tier-linked';
import { isUndefined } from '@shinefold/utils/primitives';
import type { ValidationContext } from 'sanity';

const PRICE_LABEL_REQUIRED_MESSAGE = 'Add a label when the tier has no prices.';

type TPricingTierParent = { prices?: unknown[] };

export const validatePricingTierPriceLabelRequired = (
  priceLabel: unknown,
  context: ValidationContext,
): string | true => {
  const parent = context.parent as TMaybeUndefined<TPricingTierParent>;
  const hasPrices = (parent?.prices?.length ?? 0) > 0;

  return !hasPrices &&
    !isPricingTierLinked(parent) &&
    isUndefined(defaultLanguageValue(priceLabel))
    ? PRICE_LABEL_REQUIRED_MESSAGE
    : true;
};
