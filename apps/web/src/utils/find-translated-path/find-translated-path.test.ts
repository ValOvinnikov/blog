import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import type { TTranslationMap } from '@blog/service';

import { findTranslatedPath } from './find-translated-path';

const { EN, NL, FR, DE } = LOCALE_ISO_CODES;

const translationMap: TTranslationMap = {
  homeLanguages: [EN, NL],
  groups: [
    [
      { documentType: 'page_landing', language: EN, slug: 'about' },
      { documentType: 'page_landing', language: NL, slug: 'over-ons' },
      { documentType: 'page_landing', language: DE, slug: 'über-uns' },
    ],
  ],
};

const find = (
  pathname: string,
  fromLocale: TLocaleIsoCode = EN,
  toLocale: TLocaleIsoCode = NL,
) =>
  findTranslatedPath({
    translationMap,
    pathname,
    fromLocale,
    toLocale,
    defaultLocale: EN,
  });

describe(findTranslatedPath, () => {
  it("finds a default-language page's translation under its language prefix", () => {
    expect(find('/about')).toBe('/nl/over-ons');
  });

  it('finds the default-language page without a prefix', () => {
    expect(find('/over-ons', NL, EN)).toBe('/about');
  });

  it('finds a translation through an encoded slug', () => {
    expect(find('/%C3%BCber-uns', DE, NL)).toBe('/nl/over-ons');
  });

  it('is undefined when the page has no translation in that language', () => {
    expect(find('/about', EN, FR)).toBeUndefined();
  });

  it('is undefined for a page outside the map', () => {
    expect(find('/blog')).toBeUndefined();
    expect(find('/blog/about')).toBeUndefined();
  });

  it("finds another language's Home under its prefix", () => {
    expect(find('/')).toBe('/nl');
  });

  it('finds the default-language Home without a prefix', () => {
    expect(find('/', NL, EN)).toBe('/');
  });

  it('is undefined for a language without a Home', () => {
    expect(find('/', EN, FR)).toBeUndefined();
  });

  it('keeps the same page when the language does not change', () => {
    expect(find('/blog', NL, NL)).toBe('/nl/blog');
  });
});
