import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import type { TTranslationMap } from '@blog/service';

import { toSwitchLanguageTarget } from './to-switch-language-target';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const translationMap: TTranslationMap = {
  homeLanguages: [],
  postIndexLanguages: [EN, NL],
  topicIndexLanguages: [EN, NL],
  tagIndexLanguages: [EN, NL],
  groups: [
    [
      { documentType: 'page_landing', language: EN, slug: 'about' },
      { documentType: 'page_landing', language: NL, slug: 'over-ons' },
    ],
    [
      { documentType: 'page_post', language: EN, slug: 'my-article' },
      { documentType: 'page_post', language: NL, slug: 'mijn-artikel' },
    ],
  ],
};

const target = (from: string, to: TLocaleIsoCode) =>
  toSwitchLanguageTarget({
    translationMap,
    from,
    to,
    defaultLocale: EN,
    liveLocales: [EN, NL, FR],
  });

describe(toSwitchLanguageTarget, () => {
  it("lands on the current page's translation", () => {
    expect(target('/about', NL)).toBe('/nl/over-ons');
    expect(target('/nl/over-ons', EN)).toBe('/about');
  });

  it("lands on the language's list page", () => {
    expect(target('/blog', NL)).toBe('/nl/blog');
    expect(target('/nl/blog', EN)).toBe('/blog');
    expect(target('/topics', NL)).toBe('/nl/topics');
    expect(target('/nl/tags', EN)).toBe('/tags');
    expect(target('/blog/page/2', NL)).toBe('/nl/blog');
  });

  it("lands on the post's translation", () => {
    expect(target('/blog/my-article', NL)).toBe('/nl/blog/mijn-artikel');
  });

  it("lands on the language's home page when the page has no translation", () => {
    expect(target('/about', FR)).toBe('/fr');
    expect(target('/nl/blog', FR)).toBe('/fr');
    expect(target('/blog/page/2', FR)).toBe('/fr');
  });

  it("lands on the language's blog list when the post has no translation", () => {
    expect(target('/blog/english-only', NL)).toBe('/nl/blog');
    expect(target('/nl/blog/alleen-nederlands', EN)).toBe('/blog');
  });

  it("lands on the language's topics or tags list when the archive page has no translation", () => {
    expect(target('/topics/design', NL)).toBe('/nl/topics');
    expect(target('/topics/design/page/2', NL)).toBe('/nl/topics');
    expect(target('/tags/react', NL)).toBe('/nl/tags');
    expect(target('/nl/tags/react', EN)).toBe('/tags');
  });

  it("lands on the language's home page when the untranslated page's list page does not exist there", () => {
    expect(target('/blog/english-only', FR)).toBe('/fr');
    expect(target('/topics/design/page/2', FR)).toBe('/fr');
    expect(target('/tags/react', FR)).toBe('/fr');
  });

  it('stays on the current page for its own language', () => {
    expect(target('/nl/blog', NL)).toBe('/nl/blog');
    expect(target('/blog', EN)).toBe('/blog');
  });
});
