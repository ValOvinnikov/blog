import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  getDefaultLanguage,
  setDefaultLanguage,
} from '@blog/studio/schema-types/validation/default-language/default-language';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { MOCK_VALIDATION_MESSAGE } from '@blog/studio/testing/mock-validation-context';

import { validateDefaultLanguageFilled } from './validate-default-language-filled';

const { EN, NL } = LOCALE_ISO_CODES;

describe(validateDefaultLanguageFilled, () => {
  const original = getDefaultLanguage();
  const validate = validateDefaultLanguageFilled(MOCK_VALIDATION_MESSAGE);

  afterEach(() => setDefaultLanguage(original));

  it.each([
    [
      'passes when the default language is filled in',
      [mockLocalizedValue(EN, 'About')],
      true,
    ],
    [
      'fails when only a non-default language is filled in',
      [mockLocalizedValue(NL, 'Over ons')],
      MOCK_VALIDATION_MESSAGE,
    ],
    [
      'fails when the default language is blank',
      [mockLocalizedValue(EN, '  '), mockLocalizedValue(NL, 'Over ons')],
      MOCK_VALIDATION_MESSAGE,
    ],
    ['fails when the field is not set', undefined, MOCK_VALIDATION_MESSAGE],
  ])('%s', (_description, value, expected) => {
    expect(validate(value)).toBe(expected);
  });

  it('checks the configured default language', () => {
    setDefaultLanguage(NL);

    expect(validate([mockLocalizedValue(NL, 'Over ons')])).toBe(true);
    expect(validate([mockLocalizedValue(EN, 'About')])).toBe(
      MOCK_VALIDATION_MESSAGE,
    );
  });
});
