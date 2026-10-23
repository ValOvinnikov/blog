import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';

import { defaultLanguageValue } from './default-language-value';

const { EN, NL } = LOCALE_ISO_CODES;

describe(defaultLanguageValue, () => {
  beforeEach(() => {
    setDefaultLanguage(EN);
  });

  it('returns the default language entry even when another language comes first', () => {
    expect(
      defaultLanguageValue([
        mockLocalizedValue(NL, 'Over ons'),
        mockLocalizedValue(EN, 'About'),
      ]),
    ).toBe('About');
  });

  it('returns nothing when the default language entry is blank', () => {
    expect(
      defaultLanguageValue([
        mockLocalizedValue(NL, 'Over ons'),
        mockLocalizedValue(EN, '  '),
      ]),
    ).toBeUndefined();
  });

  it('returns nothing for a field that is not set', () => {
    expect(defaultLanguageValue(undefined)).toBeUndefined();
  });
});
