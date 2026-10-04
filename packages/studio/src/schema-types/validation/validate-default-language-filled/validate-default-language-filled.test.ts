import {
  getDefaultLanguage,
  setDefaultLanguage,
} from '@blog/studio/schema-types/validation/default-language/default-language';

import { validateDefaultLanguageFilled } from './validate-default-language-filled';

const MESSAGE = 'Fill it in.';

describe(validateDefaultLanguageFilled, () => {
  const original = getDefaultLanguage();
  const validate = validateDefaultLanguageFilled(MESSAGE);

  afterEach(() => setDefaultLanguage(original));

  it('passes when the default language is filled in', () => {
    expect(validate([{ _key: 'EN', language: 'EN', value: 'About' }])).toBe(
      true,
    );
  });

  it('fails when only a non-default language is filled in', () => {
    expect(validate([{ _key: 'NL', language: 'NL', value: 'Over ons' }])).toBe(
      MESSAGE,
    );
  });

  it('fails when the default language is blank', () => {
    expect(
      validate([
        { _key: 'EN', language: 'EN', value: '  ' },
        { _key: 'NL', language: 'NL', value: 'Over ons' },
      ]),
    ).toBe(MESSAGE);
  });

  it('fails when the field is not set', () => {
    expect(validate(undefined)).toBe(MESSAGE);
  });

  it('checks the configured default language', () => {
    setDefaultLanguage('NL');

    expect(validate([{ _key: 'NL', language: 'NL', value: 'Over ons' }])).toBe(
      true,
    );
    expect(validate([{ _key: 'EN', language: 'EN', value: 'About' }])).toBe(
      MESSAGE,
    );
  });
});
