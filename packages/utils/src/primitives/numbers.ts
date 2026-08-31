/** Rounds `numerator / denominator` up to the nearest whole number, floored at 1. */
export const ceilDivideAtLeastOne = (
  numerator: number,
  denominator: number,
): number => Math.max(1, Math.ceil(numerator / denominator));
