import {
  getDefaultLanguage,
  setDefaultLanguage,
} from '@blog/studio/schema-types/validation/default-language/default-language';

import { validateDefaultLanguageBlocksFilled } from './validate-default-language-blocks-filled';

const MESSAGE = 'Fill it in.';
const BLOCKS = [{ _type: 'block', _key: 'block-1' }];

describe(validateDefaultLanguageBlocksFilled, () => {
  const original = getDefaultLanguage();
  const validate = validateDefaultLanguageBlocksFilled(MESSAGE);

  afterEach(() => setDefaultLanguage(original));

  it('passes when the default language has text', () => {
    expect(validate([{ _key: 'EN', language: 'EN', value: BLOCKS }])).toBe(
      true,
    );
  });

  it('fails when only a non-default language has text', () => {
    expect(validate([{ _key: 'NL', language: 'NL', value: BLOCKS }])).toBe(
      MESSAGE,
    );
  });

  it('fails when the default language is empty', () => {
    expect(
      validate([
        { _key: 'EN', language: 'EN', value: [] },
        { _key: 'NL', language: 'NL', value: BLOCKS },
      ]),
    ).toBe(MESSAGE);
  });

  it('fails when the field is not set', () => {
    expect(validate(undefined)).toBe(MESSAGE);
  });

  it('checks the configured default language', () => {
    setDefaultLanguage('NL');

    expect(validate([{ _key: 'NL', language: 'NL', value: BLOCKS }])).toBe(
      true,
    );
    expect(validate([{ _key: 'EN', language: 'EN', value: BLOCKS }])).toBe(
      MESSAGE,
    );
  });
});
