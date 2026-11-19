import { LOCALE_ISO_CODES } from '@shinefold/config/constants';

import { selectLiveLocalesWithin } from './get-tenant-live-locales';

const { EN, NL, FR } = LOCALE_ISO_CODES;

describe(selectLiveLocalesWithin, () => {
  it('serves the default locale and the additional ones up to the limit', () => {
    expect(
      selectLiveLocalesWithin(
        { locale: EN, additionalLocales: [NL, FR] },
        { localeLimit: 2 },
      ),
    ).toEqual([EN, NL]);
  });
});
