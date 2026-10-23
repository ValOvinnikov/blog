import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  getDefaultLanguage,
  setDefaultLanguage,
} from '@blog/studio/schema-types/validation/default-language/default-language';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { MOCK_VALIDATION_MESSAGE } from '@blog/studio/testing/mock-validation-context';

import { validateDefaultLanguageBlocksFilled } from './validate-default-language-blocks-filled';

const { EN, NL } = LOCALE_ISO_CODES;

const BLOCKS = [{ _type: 'block', _key: 'block-1' }];

describe(validateDefaultLanguageBlocksFilled, () => {
  const original = getDefaultLanguage();
  const validate = validateDefaultLanguageBlocksFilled(MOCK_VALIDATION_MESSAGE);

  afterEach(() => setDefaultLanguage(original));

  it.each([
    [
      'passes when the default language has text',
      [mockLocalizedValue(EN, BLOCKS)],
      true,
    ],
    [
      'fails when only a non-default language has text',
      [mockLocalizedValue(NL, BLOCKS)],
      MOCK_VALIDATION_MESSAGE,
    ],
    [
      'fails when the default language is empty',
      [mockLocalizedValue(EN, []), mockLocalizedValue(NL, BLOCKS)],
      MOCK_VALIDATION_MESSAGE,
    ],
    ['fails when the field is not set', undefined, MOCK_VALIDATION_MESSAGE],
  ])('%s, as Portable Text', (_description, value, expected) => {
    expect(validate(value)).toBe(expected);
  });

  it('checks the configured default language', () => {
    setDefaultLanguage(NL);

    expect(validate([mockLocalizedValue(NL, BLOCKS)])).toBe(true);
    expect(validate([mockLocalizedValue(EN, BLOCKS)])).toBe(
      MOCK_VALIDATION_MESSAGE,
    );
  });
});
