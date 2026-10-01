import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { normalizeLocaleCode } from './normalize-locale-code';

describe(normalizeLocaleCode, () => {
  it('upper-cases a lower-case code', () => {
    expect(normalizeLocaleCode('en')).toBe(LOCALE_ISO_CODES.EN);
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeLocaleCode(' nl ')).toBe(LOCALE_ISO_CODES.NL);
  });

  it('leaves an already-normalized code unchanged', () => {
    expect(normalizeLocaleCode('FR')).toBe(LOCALE_ISO_CODES.FR);
  });
});
