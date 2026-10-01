import { validatePricingSingleHighlightedTier } from '@blog/studio/schema-types/validation/validate-pricing-single-highlighted-tier/validate-pricing-single-highlighted-tier';

const SINGLE_HIGHLIGHTED_TIER_MESSAGE = 'Only one tier can be highlighted.';

describe(validatePricingSingleHighlightedTier, () => {
  it.each([
    ['no tiers are given', undefined],
    ['no tier has a label', [{ highlightLabel: '' }, {}]],
    ['a label is only whitespace', [{ highlightLabel: '   ' }, {}]],
    [
      'exactly one tier has a label',
      [{ highlightLabel: 'Most popular' }, { highlightLabel: ' ' }, {}],
    ],
  ])('passes when %s', (_description, tiers) => {
    expect(validatePricingSingleHighlightedTier(tiers)).toBe(true);
  });

  it('fails with the single-highlighted message when two tiers have a label', () => {
    expect(
      validatePricingSingleHighlightedTier([
        { highlightLabel: 'Most popular' },
        { highlightLabel: 'Best value' },
        {},
      ]),
    ).toBe(SINGLE_HIGHLIGHTED_TIER_MESSAGE);
  });
});
