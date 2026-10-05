import { LOCALE_ISO_CODES } from '@blog/config';

import { toLiveLanguagePages } from './to-live-language-pages';

const { EN, NL } = LOCALE_ISO_CODES;

describe('toLiveLanguagePages', () => {
  it('keeps pages whose language is live', () => {
    const pages = [{ language: EN }, { language: NL }];

    expect(toLiveLanguagePages({ pages, liveLocales: [EN, NL] })).toEqual(
      pages,
    );
  });

  it('excludes a page whose language is not live', () => {
    expect(
      toLiveLanguagePages({
        pages: [{ language: EN }, { language: NL }],
        liveLocales: [EN],
      }),
    ).toEqual([{ language: EN }]);
  });

  it('keeps the current locale page, leaving its removal to the caller', () => {
    const pages = [
      { language: NL, slug: 'over-ons' },
      { language: EN, slug: 'about-us' },
    ];

    expect(toLiveLanguagePages({ pages, liveLocales: [EN, NL] })).toEqual(
      pages,
    );
  });
});
