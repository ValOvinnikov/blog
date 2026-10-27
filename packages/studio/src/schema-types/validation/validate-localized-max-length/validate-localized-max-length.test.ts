import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { MOCK_VALIDATION_MESSAGE } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';

faker.seed(6021);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_MAX_LENGTH = faker.number.int({ min: 5, max: 20 });
const MOCK_FITTING_TEXT = faker.string.alpha(MOCK_MAX_LENGTH);
const MOCK_OVERLONG_TEXT = faker.string.alpha(MOCK_MAX_LENGTH + 1);

describe(validateLocalizedMaxLength, () => {
  const validate = validateLocalizedMaxLength(
    MOCK_MAX_LENGTH,
    MOCK_VALIDATION_MESSAGE,
  );

  it.each([
    [
      'passes when every language fits',
      [
        mockLocalizedValue(EN, MOCK_FITTING_TEXT),
        mockLocalizedValue(NL, MOCK_FITTING_TEXT),
      ],
      true,
    ],
    [
      'fails when any one language runs over',
      [
        mockLocalizedValue(EN, MOCK_FITTING_TEXT),
        mockLocalizedValue(NL, MOCK_OVERLONG_TEXT),
      ],
      MOCK_VALIDATION_MESSAGE,
    ],
    ['passes when the field is not set', undefined, true],
  ])('%s', (_description, field, expected) => {
    expect(validate(field)).toBe(expected);
  });
});
