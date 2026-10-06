import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import type { TTranslationMap } from '@blog/service';

import { findTranslatedPath } from './find-translated-path';

const { EN, NL, FR, DE } = LOCALE_ISO_CODES;

const translationMap: TTranslationMap = {
  homeLanguages: [EN, NL],
  postIndexLanguages: [],
  topicIndexLanguages: [],
  tagIndexLanguages: [],
  groups: [
    [
      { documentType: 'page_landing', language: EN, slug: 'about' },
      { documentType: 'page_landing', language: NL, slug: 'over-ons' },
      { documentType: 'page_landing', language: DE, slug: 'über-uns' },
    ],
    [
      { documentType: 'page_landing', language: EN, slug: 'modules/faq' },
      { documentType: 'page_landing', language: NL, slug: 'modules/vragen' },
    ],
    [
      { documentType: 'page_topic', language: EN, slug: 'design' },
      { documentType: 'page_topic', language: NL, slug: 'ontwerp' },
    ],
    [
      { documentType: 'page_tag', language: EN, slug: 'typescript' },
      { documentType: 'page_tag', language: NL, slug: 'typescript-nl' },
    ],
    [
      { documentType: 'page_post', language: EN, slug: 'my-article' },
      { documentType: 'page_post', language: NL, slug: 'mijn-artikel' },
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

  it("finds a nested page's translation under its full path", () => {
    expect(find('/modules/faq')).toBe('/nl/modules/vragen');
    expect(find('/modules/vragen', NL, EN)).toBe('/modules/faq');
  });

  it('is undefined when the page has no translation in that language', () => {
    expect(find('/about', EN, FR)).toBeUndefined();
  });

  it("finds a Topic page's translation under its own slug", () => {
    expect(find('/topics/design')).toBe('/nl/topics/ontwerp');
    expect(find('/topics/ontwerp', NL, EN)).toBe('/topics/design');
  });

  it("finds a Tag page's translation under its own slug", () => {
    expect(find('/tags/typescript')).toBe('/nl/tags/typescript-nl');
  });

  it('finds the first page of the translation from a numbered archive page', () => {
    expect(find('/topics/design/page/3')).toBe('/nl/topics/ontwerp');
  });

  it("finds a post's translation under its own slug", () => {
    expect(find('/blog/my-article')).toBe('/nl/blog/mijn-artikel');
    expect(find('/blog/mijn-artikel', NL, EN)).toBe('/blog/my-article');
  });

  it('is undefined for a post with no translation in that language', () => {
    expect(find('/blog/my-article', EN, FR)).toBeUndefined();
  });

  it('does not match a post slug against a landing page', () => {
    expect(find('/my-article')).toBeUndefined();
  });

  it('is undefined for a Topic page with no translation in that language', () => {
    expect(find('/topics/design', EN, FR)).toBeUndefined();
  });

  it('does not match a Topic slug against a landing page or Tag page', () => {
    expect(find('/design')).toBeUndefined();
    expect(find('/tags/design')).toBeUndefined();
  });

  it('is undefined for a path below an archive page that is not a page number', () => {
    expect(find('/topics/design/extra')).toBeUndefined();
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
