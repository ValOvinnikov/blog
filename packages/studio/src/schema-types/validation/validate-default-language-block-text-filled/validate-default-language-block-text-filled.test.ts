import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { validateDefaultLanguageBlockTextFilled } from '@shinefold/studio/schema-types/validation/validate-default-language-block-text-filled/validate-default-language-block-text-filled';
import { mockLocalizedValue } from '@shinefold/studio/testing/mock-documents';
import { mockTextBlock } from '@shinefold/studio/testing/mock-text-block';
import { MOCK_VALIDATION_MESSAGE } from '@shinefold/studio/testing/mock-validation-context';

faker.seed(8044);

const { EN } = LOCALE_ISO_CODES;

const MOCK_TEXT = faker.lorem.words();

describe(validateDefaultLanguageBlockTextFilled, () => {
  const validate = validateDefaultLanguageBlockTextFilled(
    MOCK_VALIDATION_MESSAGE,
  );

  it.each([
    [
      'passes when the default language has words',
      [mockLocalizedValue(EN, [mockTextBlock(MOCK_TEXT)])],
      true,
    ],
    [
      'fails when the default language block is blank',
      [mockLocalizedValue(EN, [mockTextBlock('')])],
      MOCK_VALIDATION_MESSAGE,
    ],
    ['fails when the field is not set', undefined, MOCK_VALIDATION_MESSAGE],
  ])('%s', (_description, value, expected) => {
    expect(validate(value)).toBe(expected);
  });
});
