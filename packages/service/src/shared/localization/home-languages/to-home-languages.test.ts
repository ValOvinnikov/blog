import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { toHomeLanguages } from './to-home-languages';

const { EN, NL, DE } = LOCALE_ISO_CODES;

describe(toHomeLanguages, () => {
  it('lists the language of every Home', () => {
    expect(toHomeLanguages([{ language: EN }, { language: NL }], EN)).toEqual([
      EN,
      NL,
    ]);
  });

  it('counts a Home with no language as the default language', () => {
    expect(toHomeLanguages([{ language: null }, { language: NL }], DE)).toEqual(
      [DE, NL],
    );
  });

  it('lists a language once when a legacy Home shares it', () => {
    expect(toHomeLanguages([{ language: null }, { language: EN }], EN)).toEqual(
      [EN],
    );
  });

  it('is empty when there is no Home', () => {
    expect(toHomeLanguages([], EN)).toEqual([]);
  });
});
