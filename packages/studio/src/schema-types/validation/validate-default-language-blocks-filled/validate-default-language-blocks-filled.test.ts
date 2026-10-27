import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  getDefaultLanguage,
  setDefaultLanguage,
} from '@blog/studio/schema-types/validation/default-language/default-language';
import { validateDefaultLanguageBlocksFilled } from '@blog/studio/schema-types/validation/validate-default-language-blocks-filled/validate-default-language-blocks-filled';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { MOCK_VALIDATION_MESSAGE } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';

faker.seed(6027);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_BLOCKS = [{ _type: 'block', _key: faker.string.alphanumeric(12) }];

describe(validateDefaultLanguageBlocksFilled, () => {
  const original = getDefaultLanguage();
  const validate = validateDefaultLanguageBlocksFilled(MOCK_VALIDATION_MESSAGE);

  afterEach(() => {
    setDefaultLanguage(original);
  });

  it.each([
    [
      'passes when the default language has text',
      [mockLocalizedValue(EN, MOCK_BLOCKS)],
      true,
    ],
    [
      'fails when only a non-default language has text',
      [mockLocalizedValue(NL, MOCK_BLOCKS)],
      MOCK_VALIDATION_MESSAGE,
    ],
    [
      'fails when the default language is empty',
      [mockLocalizedValue(EN, []), mockLocalizedValue(NL, MOCK_BLOCKS)],
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
        'passes when that language has text',
        [mockLocalizedValue(NL, MOCK_BLOCKS)],
        true,
      ],
      [
        'fails when only English has text',
        [mockLocalizedValue(EN, MOCK_BLOCKS)],
        MOCK_VALIDATION_MESSAGE,
      ],
    ])('%s', (_description, field, expected) => {
      expect(validate(field)).toBe(expected);
    });
  });
});
