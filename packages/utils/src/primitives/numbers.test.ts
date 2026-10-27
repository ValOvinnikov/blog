import { ceilDivideAtLeastOne } from './numbers';

describe(ceilDivideAtLeastOne, () => {
  it.each([
    ['rounds a remainder up', 20, 9, 3],
    ['divides an exact multiple evenly', 18, 9, 2],
    ['returns 1 for an exact single unit', 9, 9, 1],
    ['returns 1 for less than a single unit', 5, 9, 1],
    ['returns at least 1 for a zero numerator', 0, 9, 1],
  ])('%s', (_label, numerator, denominator, expected) => {
    expect(ceilDivideAtLeastOne(numerator, denominator)).toBe(expected);
  });
});
