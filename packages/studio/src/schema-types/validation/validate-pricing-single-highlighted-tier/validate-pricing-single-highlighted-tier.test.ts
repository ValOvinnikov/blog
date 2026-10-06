import { validatePricingSingleHighlightedTier } from '@blog/studio/schema-types/validation/validate-pricing-single-highlighted-tier/validate-pricing-single-highlighted-tier';

const SINGLE_HIGHLIGHTED_TIER_MESSAGE = 'Only one tier can be highlighted.';

const label = (entries: Record<string, string>) =>
  Object.entries(entries).map(([language, value]) => ({
    _key: language,
    language,
    value,
  }));

describe(validatePricingSingleHighlightedTier, () => {
  it.each([
    ['no tiers are given', undefined],
    ['no tier has a label', [{ highlightLabel: label({ EN: '' }) }, {}]],
    [
      'a label is only whitespace',
      [{ highlightLabel: label({ EN: '   ' }) }, {}],
    ],
    [
      'exactly one tier has a label',
      [
        { highlightLabel: label({ EN: 'Most popular' }) },
        { highlightLabel: label({ EN: ' ' }) },
        {},
      ],
    ],
    [
      'a second tier has a label only in another language',
      [
        { highlightLabel: label({ EN: 'Most popular' }) },
        { highlightLabel: label({ NL: 'Beste keuze' }) },
      ],
    ],
  ])('passes when %s', (_description, tiers) => {
    expect(validatePricingSingleHighlightedTier(tiers)).toBe(true);
  });

  it('fails with the single-highlighted message when two tiers have a default-language label', () => {
    expect(
      validatePricingSingleHighlightedTier([
        { highlightLabel: label({ EN: 'Most popular' }) },
        { highlightLabel: label({ EN: 'Best value', NL: 'Beste keuze' }) },
        {},
      ]),
    ).toBe(SINGLE_HIGHLIGHTED_TIER_MESSAGE);
  });
});
