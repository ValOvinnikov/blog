import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validatePricingSingleHighlightedTier } from '@blog/studio/schema-types/validation/validate-pricing-single-highlighted-tier/validate-pricing-single-highlighted-tier';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';

faker.seed(6023);

const { EN, NL } = LOCALE_ISO_CODES;

const SINGLE_HIGHLIGHTED_TIER_MESSAGE = 'Only one tier can be highlighted.';

const MOCK_ENGLISH_LABEL = faker.lorem.words();
const MOCK_OTHER_ENGLISH_LABEL = faker.lorem.words();
const MOCK_DUTCH_LABEL = faker.lorem.words();

const mockHighlightedTier = (
  ...labels: ReturnType<typeof mockLocalizedValue<string>>[]
) => ({ highlightLabel: labels });

describe(validatePricingSingleHighlightedTier, () => {
  it.each([
    ['passes when no tiers are given', undefined, true],
    [
      'passes when no tier has a label',
      [mockHighlightedTier(mockLocalizedValue(EN, '')), {}],
      true,
    ],
    [
      'passes when a label is only whitespace',
      [mockHighlightedTier(mockLocalizedValue(EN, '   ')), {}],
      true,
    ],
    [
      'passes when exactly one tier has a label',
      [
        mockHighlightedTier(mockLocalizedValue(EN, MOCK_ENGLISH_LABEL)),
        mockHighlightedTier(mockLocalizedValue(EN, ' ')),
        {},
      ],
      true,
    ],
    [
      'passes when a second tier has a label only in another language',
      [
        mockHighlightedTier(mockLocalizedValue(EN, MOCK_ENGLISH_LABEL)),
        mockHighlightedTier(mockLocalizedValue(NL, MOCK_DUTCH_LABEL)),
      ],
      true,
    ],
    [
      'fails when two tiers have a default-language label',
      [
        mockHighlightedTier(mockLocalizedValue(EN, MOCK_ENGLISH_LABEL)),
        mockHighlightedTier(
          mockLocalizedValue(EN, MOCK_OTHER_ENGLISH_LABEL),
          mockLocalizedValue(NL, MOCK_DUTCH_LABEL),
        ),
        {},
      ],
      SINGLE_HIGHLIGHTED_TIER_MESSAGE,
    ],
  ])('%s', (_description, tiers, expected) => {
    expect(validatePricingSingleHighlightedTier(tiers)).toBe(expected);
  });
});
