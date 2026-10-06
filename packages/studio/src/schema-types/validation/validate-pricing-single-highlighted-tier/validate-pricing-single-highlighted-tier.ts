import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';

const SINGLE_HIGHLIGHTED_TIER_MESSAGE = 'Only one tier can be highlighted.';

type TPricingTierItem = { highlightLabel?: unknown };

export const validatePricingSingleHighlightedTier = (
  tiers: TPricingTierItem[] | undefined,
): string | true => {
  const highlightedCount = (tiers ?? []).filter(
    (tier) => defaultLanguageValue(tier.highlightLabel) !== undefined,
  ).length;

  return highlightedCount > 1 ? SINGLE_HIGHLIGHTED_TIER_MESSAGE : true;
};
