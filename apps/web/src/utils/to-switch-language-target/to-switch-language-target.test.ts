import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  routes,
  type TLocaleIsoCode,
} from '@blog/config';
import type { TTranslationMap } from '@blog/service';
import { faker } from '@faker-js/faker';

import { toSwitchLanguageTarget } from './to-switch-language-target';

faker.seed(6012);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_PAGE_SLUG_EN = faker.lorem.slug(2);
const MOCK_PAGE_SLUG_NL = faker.lorem.slug(2);
const MOCK_POST_SLUG_EN = faker.lorem.slug(2);
const MOCK_POST_SLUG_NL = faker.lorem.slug(2);
const MOCK_UNTRANSLATED_POST_EN = faker.lorem.slug(2);
const MOCK_UNTRANSLATED_POST_NL = faker.lorem.slug(2);
const MOCK_ARCHIVE_SLUG = faker.lorem.slug(1);
const MOCK_PAGE_NUMBER = faker.number.int({ min: 2, max: 9 });

const MOCK_TRANSLATION_MAP: TTranslationMap = {
  homeLanguages: [],
  postIndexLanguages: [EN, NL],
  topicIndexLanguages: [EN, NL],
  tagIndexLanguages: [EN, NL],
  groups: [
    [
      { documentType: 'page_landing', language: EN, slug: MOCK_PAGE_SLUG_EN },
      { documentType: 'page_landing', language: NL, slug: MOCK_PAGE_SLUG_NL },
    ],
    [
      { documentType: 'page_post', language: EN, slug: MOCK_POST_SLUG_EN },
      { documentType: 'page_post', language: NL, slug: MOCK_POST_SLUG_NL },
    ],
  ],
};

const inLanguage = (locale: TLocaleIsoCode, href: string) =>
  `/${LOCALE_BCP47_TAGS[locale]}${href}`;

const homeIn = (locale: TLocaleIsoCode) => `/${LOCALE_BCP47_TAGS[locale]}`;

const target = (from: string, to: TLocaleIsoCode) =>
  toSwitchLanguageTarget({
    translationMap: MOCK_TRANSLATION_MAP,
    from,
    to,
    defaultLocale: EN,
    liveLocales: [EN, NL, FR],
  });

describe(toSwitchLanguageTarget, () => {
  it.each([
    {
      case: 'into the other language',
      from: routes.landingPage(MOCK_PAGE_SLUG_EN),
      to: NL,
      expected: inLanguage(NL, routes.landingPage(MOCK_PAGE_SLUG_NL)),
    },
    {
      case: 'back into the default language',
      from: inLanguage(NL, routes.landingPage(MOCK_PAGE_SLUG_NL)),
      to: EN,
      expected: routes.landingPage(MOCK_PAGE_SLUG_EN),
    },
    {
      case: 'for a post',
      from: routes.post(MOCK_POST_SLUG_EN),
      to: NL,
      expected: inLanguage(NL, routes.post(MOCK_POST_SLUG_NL)),
    },
  ])(
    "lands on the current page's translation $case",
    ({ from, to, expected }) => {
      expect(target(from, to)).toBe(expected);
    },
  );

  it.each([
    {
      case: 'the blog',
      from: routes.blogIndex(),
      to: NL,
      expected: inLanguage(NL, routes.blogIndex()),
    },
    {
      case: 'the blog back in the default language',
      from: inLanguage(NL, routes.blogIndex()),
      to: EN,
      expected: routes.blogIndex(),
    },
    {
      case: 'the topics',
      from: routes.topics(),
      to: NL,
      expected: inLanguage(NL, routes.topics()),
    },
    {
      case: 'the tags back in the default language',
      from: inLanguage(NL, routes.tags()),
      to: EN,
      expected: routes.tags(),
    },
    {
      case: 'a later page of the blog',
      from: routes.blogIndex(MOCK_PAGE_NUMBER),
      to: NL,
      expected: inLanguage(NL, routes.blogIndex()),
    },
  ])(
    "lands on the language's list page for $case",
    ({ from, to, expected }) => {
      expect(target(from, to)).toBe(expected);
    },
  );

  it.each([
    {
      case: 'a page',
      from: routes.landingPage(MOCK_PAGE_SLUG_EN),
    },
    { case: 'the blog list', from: inLanguage(NL, routes.blogIndex()) },
    {
      case: 'the second page of an untranslated list',
      from: routes.blogIndex(MOCK_PAGE_NUMBER),
    },
    {
      case: 'a post missing from the language',
      from: routes.post(MOCK_UNTRANSLATED_POST_EN),
    },
    {
      case: 'an archive page',
      from: routes.topic(MOCK_ARCHIVE_SLUG, MOCK_PAGE_NUMBER),
    },
    { case: 'a tag page', from: routes.tag(MOCK_ARCHIVE_SLUG) },
  ])(
    "lands on the language's home page when $case has no counterpart there",
    ({ from }) => {
      expect(target(from, FR)).toBe(homeIn(FR));
    },
  );

  it.each([
    {
      case: 'an untranslated post',
      from: routes.post(MOCK_UNTRANSLATED_POST_EN),
      to: NL,
      expected: inLanguage(NL, routes.blogIndex()),
    },
    {
      case: 'an untranslated post in the other language',
      from: inLanguage(NL, routes.post(MOCK_UNTRANSLATED_POST_NL)),
      to: EN,
      expected: routes.blogIndex(),
    },
    {
      case: 'an untranslated topic',
      from: routes.topic(MOCK_ARCHIVE_SLUG),
      to: NL,
      expected: inLanguage(NL, routes.topics()),
    },
    {
      case: 'a later topic page',
      from: routes.topic(MOCK_ARCHIVE_SLUG, MOCK_PAGE_NUMBER),
      to: NL,
      expected: inLanguage(NL, routes.topics()),
    },
    {
      case: 'an untranslated tag',
      from: routes.tag(MOCK_ARCHIVE_SLUG),
      to: NL,
      expected: inLanguage(NL, routes.tags()),
    },
    {
      case: 'an untranslated tag back in the default language',
      from: inLanguage(NL, routes.tag(MOCK_ARCHIVE_SLUG)),
      to: EN,
      expected: routes.tags(),
    },
  ])(
    "lands on the language's list page when $case has no translation",
    ({ from, to, expected }) => {
      expect(target(from, to)).toBe(expected);
    },
  );

  it.each([
    { case: 'a non-default', from: inLanguage(NL, routes.blogIndex()), to: NL },
    { case: 'the default', from: routes.blogIndex(), to: EN },
  ])('stays on the current page for $case language', ({ from, to }) => {
    expect(target(from, to)).toBe(from);
  });
});
