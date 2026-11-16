import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { setDefaultLanguage } from '@shinefold/studio/schema-types/validation/default-language/default-language';
import { defaultLanguageValue } from '@shinefold/studio/schema-types/validation/default-language-value/default-language-value';
import { mockLocalizedValue } from '@shinefold/studio/testing/mock-documents';

faker.seed(6017);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_ENGLISH_TEXT = faker.lorem.words();
const MOCK_DUTCH_TEXT = faker.lorem.words();

describe(defaultLanguageValue, () => {
  beforeEach(() => {
    setDefaultLanguage(EN);
  });

  it('returns the default-language entry when another language comes first', () => {
    const value = defaultLanguageValue([
      mockLocalizedValue(NL, MOCK_DUTCH_TEXT),
      mockLocalizedValue(EN, MOCK_ENGLISH_TEXT),
    ]);

    expect(value).toBe(MOCK_ENGLISH_TEXT);
  });

  it.each([
    [
      'the default-language entry is blank',
      [mockLocalizedValue(NL, MOCK_DUTCH_TEXT), mockLocalizedValue(EN, '  ')],
    ],
    ['the field is not set', undefined],
  ])('returns nothing when %s', (_description, field) => {
    expect(defaultLanguageValue(field)).toBeUndefined();
  });
});
