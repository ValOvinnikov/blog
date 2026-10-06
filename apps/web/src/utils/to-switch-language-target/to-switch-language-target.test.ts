import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import type { TTranslationMap } from '@blog/service';

import { toSwitchLanguageTarget } from './to-switch-language-target';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const translationMap: TTranslationMap = {
  homeLanguages: [],
  postIndexLanguages: [],
  topicIndexLanguages: [],
  tagIndexLanguages: [],
  groups: [
    [
      { documentType: 'page_landing', language: EN, slug: 'about' },
      { documentType: 'page_landing', language: NL, slug: 'over-ons' },
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

  it("lands on the language's home page when the page has no translation", () => {
    expect(target('/about', FR)).toBe('/fr');
    expect(target('/nl/blog', EN)).toBe('/');
  });

  it('stays on the current page for its own language', () => {
    expect(target('/nl/blog', NL)).toBe('/nl/blog');
    expect(target('/blog', EN)).toBe('/blog');
  });
});
