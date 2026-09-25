const SINGLE_HIGHLIGHTED_TIER_MESSAGE = 'Only one tier can be highlighted.';

type TPricingTierItem = { isHighlighted?: boolean };

export const validatePricingSingleHighlightedTier = (
  tiers: TPricingTierItem[] | undefined,
): string | true => {
  const highlightedCount = (tiers ?? []).filter(
    (tier) => tier.isHighlighted,
  ).length;

  return highlightedCount > 1 ? SINGLE_HIGHLIGHTED_TIER_MESSAGE : true;
};
