import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  getDefaultLanguage,
  setDefaultLanguage,
} from '@blog/studio/schema-types/validation/default-language/default-language';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { MOCK_VALIDATION_MESSAGE } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';

faker.seed(6026);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_ENGLISH_TEXT = faker.lorem.words();
const MOCK_DUTCH_TEXT = faker.lorem.words();

describe(validateDefaultLanguageFilled, () => {
  const original = getDefaultLanguage();
  const validate = validateDefaultLanguageFilled(MOCK_VALIDATION_MESSAGE);

  afterEach(() => {
    setDefaultLanguage(original);
  });

  it.each([
    [
      'passes when the default language is filled in',
      [mockLocalizedValue(EN, MOCK_ENGLISH_TEXT)],
      true,
    ],
    [
      'fails when only a non-default language is filled in',
      [mockLocalizedValue(NL, MOCK_DUTCH_TEXT)],
      MOCK_VALIDATION_MESSAGE,
    ],
    [
      'fails when the default language is blank',
      [mockLocalizedValue(EN, '  '), mockLocalizedValue(NL, MOCK_DUTCH_TEXT)],
      MOCK_VALIDATION_MESSAGE,
    ],
    ['fails when the field is not set', undefined, MOCK_VALIDATION_MESSAGE],
  ])('%s', (_description, field, expected) => {
    expect(validate(field)).toBe(expected);
  });

  describe('with another default language configured', () => {
    beforeEach(() => {
      setDefaultLanguage(NL);
    });

    it.each([
      [
        'passes when that language is filled in',
        [mockLocalizedValue(NL, MOCK_DUTCH_TEXT)],
        true,
      ],
      [
        'fails when only English is filled in',
        [mockLocalizedValue(EN, MOCK_ENGLISH_TEXT)],
        MOCK_VALIDATION_MESSAGE,
      ],
    ])('%s', (_description, field, expected) => {
      expect(validate(field)).toBe(expected);
    });
  });
});
