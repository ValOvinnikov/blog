import { toPageTranslations } from './to-page-translations';

describe(toPageTranslations, () => {
  it('is empty when the page has no translation metadata', () => {
    expect(toPageTranslations(null)).toEqual([]);
  });

  it('drops entries without a language or slug', () => {
    expect(
      toPageTranslations([
        { language: 'EN', slug: 'about' },
        { language: null, slug: 'x' },
        { language: 'NL', slug: null },
      ]),
    ).toEqual([{ language: 'EN', slug: 'about' }]);
  });
});
