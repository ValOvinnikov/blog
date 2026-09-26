const PERIOD_DUPLICATE_MESSAGE =
  'Each price period can only be used once per tier.';

type TPricingPriceItem = { period?: string };

export const validatePricingPricePeriodsUnique = (
  prices: TPricingPriceItem[] | undefined,
): string | true => {
  const periods = (prices ?? [])
    .map((price) => price.period)
    .filter((period): period is string => Boolean(period));

  return new Set(periods).size !== periods.length
    ? PERIOD_DUPLICATE_MESSAGE
    : true;
};
