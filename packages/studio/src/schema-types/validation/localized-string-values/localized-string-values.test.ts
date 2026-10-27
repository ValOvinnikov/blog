import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { localizedStringValues } from '@blog/studio/schema-types/validation/localized-string-values/localized-string-values';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';

faker.seed(6018);

const { EN, FR, NL } = LOCALE_ISO_CODES;

const MOCK_ENGLISH_TEXT = faker.lorem.words();
const MOCK_DUTCH_TEXT = faker.lorem.words();

describe(localizedStringValues, () => {
  it.each([
    [
      'returns the filled-in value of every language',
      [
        mockLocalizedValue(EN, MOCK_ENGLISH_TEXT),
        mockLocalizedValue(NL, MOCK_DUTCH_TEXT),
      ],
      [MOCK_ENGLISH_TEXT, MOCK_DUTCH_TEXT],
    ],
    [
      'skips languages whose value is empty or blank',
      [
        mockLocalizedValue(EN, MOCK_ENGLISH_TEXT),
        mockLocalizedValue(NL, '   '),
        mockLocalizedValue(FR),
      ],
      [MOCK_ENGLISH_TEXT],
    ],
    ['returns nothing for a field that is not set', undefined, []],
  ])('%s', (_description, field, expected) => {
    expect(localizedStringValues(field)).toEqual(expected);
  });
});
