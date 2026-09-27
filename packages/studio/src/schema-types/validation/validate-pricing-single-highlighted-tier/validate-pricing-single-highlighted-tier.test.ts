import { validatePricingSingleHighlightedTier } from '@blog/studio/schema-types/validation/validate-pricing-single-highlighted-tier/validate-pricing-single-highlighted-tier';

const SINGLE_HIGHLIGHTED_TIER_MESSAGE = 'Only one tier can be highlighted.';

describe(validatePricingSingleHighlightedTier, () => {
  it.each([
    ['no tiers are given', undefined],
    ['no tier is highlighted', [{ isHighlighted: false }, {}]],
    [
      'exactly one tier is highlighted',
      [{ isHighlighted: true }, { isHighlighted: false }, {}],
    ],
  ])('passes when %s', (_description, tiers) => {
    expect(validatePricingSingleHighlightedTier(tiers)).toBe(true);
  });

  it('fails with the single-highlighted message when two tiers are highlighted', () => {
    expect(
      validatePricingSingleHighlightedTier([
        { isHighlighted: true },
        { isHighlighted: true },
        {},
      ]),
    ).toBe(SINGLE_HIGHLIGHTED_TIER_MESSAGE);
  });
});
