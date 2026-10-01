import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { getUntranslatedTargetLocales } from './untranslated-target';

const { EN, NL, FR, DE } = LOCALE_ISO_CODES;

describe(getUntranslatedTargetLocales, () => {
  it('lists every live language except the default when the page has no translations', () => {
    expect(getUntranslatedTargetLocales([], [EN, NL, FR], EN)).toEqual([
      NL,
      FR,
    ]);
  });

  it('skips the languages the page is translated into', () => {
    expect(getUntranslatedTargetLocales([EN, NL], [EN, NL, FR], EN)).toEqual([
      FR,
    ]);
  });

  it('ignores translations into languages that are not live', () => {
    expect(getUntranslatedTargetLocales([EN, DE], [EN, NL], EN)).toEqual([NL]);
  });

  it('reports nothing for a single-language tenant', () => {
    expect(getUntranslatedTargetLocales([], [EN], EN)).toEqual([]);
  });

  it('ignores values that are not supported language codes', () => {
    expect(getUntranslatedTargetLocales(['nl', null], [EN, NL], EN)).toEqual([
      NL,
    ]);
  });
});
