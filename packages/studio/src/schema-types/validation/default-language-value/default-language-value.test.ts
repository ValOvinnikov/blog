import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';

import { defaultLanguageValue } from './default-language-value';

describe(defaultLanguageValue, () => {
  beforeEach(() => {
    setDefaultLanguage('EN');
  });

  it('returns the default language entry even when another language comes first', () => {
    expect(
      defaultLanguageValue([
        { _key: 'NL', language: 'NL', value: 'Over ons' },
        { _key: 'EN', language: 'EN', value: 'About' },
      ]),
    ).toBe('About');
  });

  it('returns nothing when the default language entry is blank', () => {
    expect(
      defaultLanguageValue([
        { _key: 'NL', language: 'NL', value: 'Over ons' },
        { _key: 'EN', language: 'EN', value: '  ' },
      ]),
    ).toBeUndefined();
  });

  it('returns nothing for a field that is not set', () => {
    expect(defaultLanguageValue(undefined)).toBeUndefined();
  });
});
