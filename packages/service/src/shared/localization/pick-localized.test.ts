import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { pickLocalized } from './pick-localized';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const entries = [
  { language: EN, value: 'Hello' },
  { language: NL, value: 'Hallo' },
];

describe(pickLocalized, () => {
  it('returns the value in the requested language', () => {
    expect(pickLocalized(entries, { locale: NL, defaultLocale: EN })).toBe(
      'Hallo',
    );
  });

  it('falls back to the default language when the requested one is missing', () => {
    expect(pickLocalized(entries, { locale: FR, defaultLocale: EN })).toBe(
      'Hello',
    );
  });

  it('falls back when the requested entry has no value', () => {
    expect(
      pickLocalized([{ language: NL, value: null }, entries[0]!], {
        locale: NL,
        defaultLocale: EN,
      }),
    ).toBe('Hello');
  });

  it('returns nothing when neither language has a value', () => {
    expect(
      pickLocalized([entries[1]!], { locale: FR, defaultLocale: EN }),
    ).toBeNull();
  });

  it('returns nothing when there are no entries', () => {
    expect(pickLocalized(null, { locale: NL, defaultLocale: EN })).toBeNull();
  });
});
