import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_ABOUT_SLUG } from '@blog/service/testing/shared/translated-pages-dataset';
import { faker } from '@faker-js/faker';

import { toPageTranslations } from './to-page-translations';

faker.seed(6016);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_ORPHAN_SLUG = faker.lorem.slug();

describe(toPageTranslations, () => {
  it('is empty when the page has no translation metadata', () => {
    const translations = toPageTranslations(null);

    expect(translations).toEqual([]);
  });

  it('drops entries without a language or slug', () => {
    const translations = toPageTranslations([
      { language: EN, slug: MOCK_ABOUT_SLUG },
      { language: null, slug: MOCK_ORPHAN_SLUG },
      { language: NL, slug: null },
    ]);

    expect(translations).toEqual([{ language: EN, slug: MOCK_ABOUT_SLUG }]);
  });
});
