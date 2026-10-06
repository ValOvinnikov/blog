import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { toPageLanguages } from './to-page-languages';

const { EN, NL, DE } = LOCALE_ISO_CODES;

describe(toPageLanguages, () => {
  it('lists the language of every page', () => {
    expect(toPageLanguages([{ language: EN }, { language: NL }], EN)).toEqual([
      EN,
      NL,
    ]);
  });

  it('counts a page with no language as the default language', () => {
    expect(toPageLanguages([{ language: null }, { language: NL }], DE)).toEqual(
      [DE, NL],
    );
  });

  it('lists a language once when a legacy page shares it', () => {
    expect(toPageLanguages([{ language: null }, { language: EN }], EN)).toEqual(
      [EN],
    );
  });

  it('is empty when there is no page', () => {
    expect(toPageLanguages([], EN)).toEqual([]);
  });
});
