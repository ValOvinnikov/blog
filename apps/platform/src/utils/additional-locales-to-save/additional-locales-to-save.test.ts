import { LOCALE_ISO_CODES } from '@blog/config';

import { additionalLocalesToSave } from './additional-locales-to-save';

const { NL, FR, DE, ES } = LOCALE_ISO_CODES;

describe(additionalLocalesToSave, () => {
  it('saves the live languages in catalogue order', () => {
    expect(additionalLocalesToSave([FR, NL], [ES], false)).toEqual([NL, FR]);
  });

  it('keeps every stored language after the live ones while over the limit', () => {
    expect(additionalLocalesToSave([NL, DE], [NL, FR, DE], true)).toEqual([
      NL,
      DE,
      FR,
    ]);
  });
});
