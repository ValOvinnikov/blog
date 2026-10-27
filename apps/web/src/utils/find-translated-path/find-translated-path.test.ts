import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  routes,
  type TLocaleIsoCode,
} from '@blog/config';
import type { TTranslationMap } from '@blog/service';
import { faker } from '@faker-js/faker';

import { findTranslatedPath } from './find-translated-path';

faker.seed(116);

const { EN, NL, FR, DE } = LOCALE_ISO_CODES;
const NL_PREFIX = `/${LOCALE_BCP47_TAGS.NL}`;
const LANDING_TYPE = 'page_landing';
const TOPIC_TYPE = 'page_topic';
const TAG_TYPE = 'page_tag';
const POST_TYPE = 'page_post';

const MOCK_EN_LANDING = faker.lorem.slug();
const MOCK_NL_LANDING = faker.lorem.slug();
const MOCK_EN_NESTED_LEAF = faker.lorem.slug();
const MOCK_NL_NESTED_LEAF = faker.lorem.slug();
const MOCK_EN_TOPIC = faker.lorem.slug();
const MOCK_NL_TOPIC = faker.lorem.slug();
const MOCK_EN_TAG = faker.lorem.slug();
const MOCK_NL_TAG = faker.lorem.slug();
const MOCK_EN_POST = faker.lorem.slug();
const MOCK_NL_POST = faker.lorem.slug();
const MOCK_UNKNOWN_SLUG = faker.lorem.slug();
const MOCK_NESTED_SEGMENT = faker.lorem.word();
const MOCK_EN_NESTED = `${MOCK_NESTED_SEGMENT}/${MOCK_EN_NESTED_LEAF}`;
const MOCK_NL_NESTED = `${MOCK_NESTED_SEGMENT}/${MOCK_NL_NESTED_LEAF}`;
const MOCK_DE_LANDING = `über-${faker.lorem.word()}`;
const MOCK_EXTRA_SEGMENT = faker.lorem.word();

const MOCK_TRANSLATION_MAP: TTranslationMap = {
  homeLanguages: [EN, NL],
  postIndexLanguages: [EN, NL],
  topicIndexLanguages: [EN, NL],
  tagIndexLanguages: [EN],
  groups: [
    [
      { documentType: LANDING_TYPE, language: EN, slug: MOCK_EN_LANDING },
      { documentType: LANDING_TYPE, language: NL, slug: MOCK_NL_LANDING },
      { documentType: LANDING_TYPE, language: DE, slug: MOCK_DE_LANDING },
    ],
    [
      { documentType: LANDING_TYPE, language: EN, slug: MOCK_EN_NESTED },
      { documentType: LANDING_TYPE, language: NL, slug: MOCK_NL_NESTED },
    ],
    [
      { documentType: TOPIC_TYPE, language: EN, slug: MOCK_EN_TOPIC },
      { documentType: TOPIC_TYPE, language: NL, slug: MOCK_NL_TOPIC },
    ],
    [
      { documentType: TAG_TYPE, language: EN, slug: MOCK_EN_TAG },
      { documentType: TAG_TYPE, language: NL, slug: MOCK_NL_TAG },
    ],
    [
      { documentType: POST_TYPE, language: EN, slug: MOCK_EN_POST },
      { documentType: POST_TYPE, language: NL, slug: MOCK_NL_POST },
    ],
  ],
};

const nlPath = (path: string) =>
  path === routes.home() ? NL_PREFIX : `${NL_PREFIX}${path}`;

const find = (
  pathname: string,
  fromLocale: TLocaleIsoCode = EN,
  toLocale: TLocaleIsoCode = NL,
) =>
  findTranslatedPath({
    translationMap: MOCK_TRANSLATION_MAP,
    pathname,
    fromLocale,
    toLocale,
    defaultLocale: EN,
  });

describe(findTranslatedPath, () => {
  it.each([
    {
      case: "a default-language page's translation under its prefix",
      pathname: routes.landingPage(MOCK_EN_LANDING),
      expected: nlPath(routes.landingPage(MOCK_NL_LANDING)),
    },
    {
      case: "a nested page's translation under its full path",
      pathname: routes.landingPage(MOCK_EN_NESTED),
      expected: nlPath(routes.landingPage(MOCK_NL_NESTED)),
    },
    {
      case: "a Topic page's translation under its own slug",
      pathname: routes.topic(MOCK_EN_TOPIC),
      expected: nlPath(routes.topic(MOCK_NL_TOPIC)),
    },
    {
      case: "a Tag page's translation under its own slug",
      pathname: routes.tag(MOCK_EN_TAG),
      expected: nlPath(routes.tag(MOCK_NL_TAG)),
    },
    {
      case: "a post's translation under its own slug",
      pathname: routes.post(MOCK_EN_POST),
      expected: nlPath(routes.post(MOCK_NL_POST)),
    },
    {
      case: 'the first page of the translation from a numbered archive page',
      pathname: routes.topic(MOCK_EN_TOPIC, 3),
      expected: nlPath(routes.topic(MOCK_NL_TOPIC)),
    },
    {
      case: "another language's list page under its prefix",
      pathname: routes.topics(),
      expected: nlPath(routes.topics()),
    },
    {
      case: 'the first blog list page from a numbered blog list page',
      pathname: routes.blogIndex(2),
      expected: nlPath(routes.blogIndex()),
    },
    {
      case: "another language's Home under its prefix",
      pathname: routes.home(),
      expected: nlPath(routes.home()),
    },
  ])('finds $case', ({ pathname, expected }) => {
    expect(find(pathname)).toBe(expected);
  });

  it.each([
    {
      case: 'the default-language page without a prefix',
      pathname: routes.landingPage(MOCK_NL_LANDING),
      expected: routes.landingPage(MOCK_EN_LANDING),
    },
    {
      case: "a nested page's default-language translation",
      pathname: routes.landingPage(MOCK_NL_NESTED),
      expected: routes.landingPage(MOCK_EN_NESTED),
    },
    {
      case: "a Topic page's default-language translation",
      pathname: routes.topic(MOCK_NL_TOPIC),
      expected: routes.topic(MOCK_EN_TOPIC),
    },
    {
      case: "a post's default-language translation",
      pathname: routes.post(MOCK_NL_POST),
      expected: routes.post(MOCK_EN_POST),
    },
    {
      case: 'the default-language list page without a prefix',
      pathname: routes.topics(),
      expected: routes.topics(),
    },
    {
      case: 'the default-language Home without a prefix',
      pathname: routes.home(),
      expected: routes.home(),
    },
  ])('finds $case when switching back', ({ pathname, expected }) => {
    expect(find(pathname, NL, EN)).toBe(expected);
  });

  it('finds a translation through an encoded slug', () => {
    const pathname = routes.landingPage(encodeURIComponent(MOCK_DE_LANDING));

    expect(find(pathname, DE, NL)).toBe(
      nlPath(routes.landingPage(MOCK_NL_LANDING)),
    );
  });

  it('keeps the same page when the language does not change', () => {
    expect(find(routes.blogIndex(), NL, NL)).toBe(nlPath(routes.blogIndex()));
  });

  it.each([
    { case: 'a page', pathname: routes.landingPage(MOCK_EN_LANDING) },
    { case: 'a post', pathname: routes.post(MOCK_EN_POST) },
    { case: 'a Topic page', pathname: routes.topic(MOCK_EN_TOPIC) },
    { case: 'the blog list page', pathname: routes.blogIndex() },
    { case: 'a numbered blog list page', pathname: routes.blogIndex(2) },
    { case: 'Home', pathname: routes.home() },
  ])(
    'is undefined for $case with no translation in that language',
    ({ pathname }) => {
      expect(find(pathname, EN, FR)).toBeUndefined();
    },
  );

  it.each([
    {
      case: 'a post slug as a landing page',
      pathname: routes.landingPage(MOCK_EN_POST),
    },
    {
      case: 'a Topic slug as a landing page',
      pathname: routes.landingPage(MOCK_EN_TOPIC),
    },
    { case: 'a Topic slug as a Tag page', pathname: routes.tag(MOCK_EN_TOPIC) },
    {
      case: 'a landing slug as a post',
      pathname: routes.post(MOCK_EN_LANDING),
    },
    {
      case: 'a path below an archive page that is not a page number',
      pathname: `${routes.topic(MOCK_EN_TOPIC)}/${MOCK_EXTRA_SEGMENT}`,
    },
    {
      case: 'a page outside the map',
      pathname: routes.landingPage(MOCK_UNKNOWN_SLUG),
    },
    {
      case: 'a post outside the map',
      pathname: routes.post(MOCK_UNKNOWN_SLUG),
    },
    { case: 'a list page the language lacks', pathname: routes.tags() },
  ])('is undefined for $case', ({ pathname }) => {
    expect(find(pathname)).toBeUndefined();
  });
});
