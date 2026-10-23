import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_ABOUT_SLUG } from '@blog/service/testing/shared/translated-pages-dataset';

import { toPageTranslations } from './to-page-translations';

const { EN, NL } = LOCALE_ISO_CODES;

describe(toPageTranslations, () => {
  it('is empty when the page has no translation metadata', () => {
    expect(toPageTranslations(null)).toEqual([]);
  });

  it('drops entries without a language or slug', () => {
    expect(
      toPageTranslations([
        { language: EN, slug: MOCK_ABOUT_SLUG },
        { language: null, slug: 'x' },
        { language: NL, slug: null },
      ]),
    ).toEqual([{ language: EN, slug: MOCK_ABOUT_SLUG }]);
  });
});
