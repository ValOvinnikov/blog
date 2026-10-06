import { LOCALE_ISO_CODES } from '@blog/config';

import { matchAcceptLanguage } from './match-accept-language';

const { EN, NL, FR } = LOCALE_ISO_CODES;

describe(matchAcceptLanguage, () => {
  it('picks the highest-weighted live language', () => {
    expect(
      matchAcceptLanguage('fr;q=0.5, nl-BE;q=0.9, en;q=0.7', [EN, NL, FR]),
    ).toBe(NL);
  });

  it('matches a regional tag on its primary language', () => {
    expect(matchAcceptLanguage('nl-NL', [EN, NL])).toBe(NL);
  });

  it('skips languages the tenant does not serve', () => {
    expect(matchAcceptLanguage('de, fr;q=0.8', [EN, FR])).toBe(FR);
  });

  it('keeps header order between equal weights', () => {
    expect(matchAcceptLanguage('fr, nl', [EN, NL, FR])).toBe(FR);
  });

  it('ignores a language refused with q=0 and the wildcard', () => {
    expect(matchAcceptLanguage('nl;q=0, *', [EN, NL])).toBeUndefined();
  });

  it('is undefined without a header', () => {
    expect(matchAcceptLanguage(null, [EN, NL])).toBeUndefined();
  });
});
