import { faker } from '@faker-js/faker';

import { LOCALE_ISO_CODES, NEWSLETTER_RESULT } from '@blog/config/constants';

import { pageHref, routes } from './routes';

faker.seed(6028);

const MOCK_SLUG = faker.lorem.word();
const MOCK_PAGE = faker.number.int({ min: 2, max: 99 });
const MOCK_TOKEN = faker.string.alphanumeric(16);
const MOCK_RESERVED_CHARACTER_TOKEN = 'a b&c=d';
const MOCK_CURRENT_PATH = '/nl/over ons';
const NEWSLETTER_UNSUBSCRIBE_PATH = '/api/newsletter/unsubscribe';

describe('routes', () => {
  it.each([
    ['home', routes.home(), '/'],
    ['topics', routes.topics(), '/topics'],
    ['tags', routes.tags(), '/tags'],
    ['bookmarks', routes.bookmarks(), '/bookmarks'],
    ['account hub', routes.account(), '/account'],
    ['account data-export', routes.accountExport(), '/api/account/export'],
    ['site-wide RSS feed', routes.rssFeed(), '/rss.xml'],
  ])('builds the %s path', (_route, path, expected) => {
    expect(path).toBe(expected);
  });

  it.each([
    ['post', routes.post(MOCK_SLUG), `/blog/${MOCK_SLUG}`],
    ['landing page', routes.landingPage(MOCK_SLUG), `/${MOCK_SLUG}`],
    [
      'per-tag RSS feed',
      routes.tagRssFeed(MOCK_SLUG),
      `/tags/${MOCK_SLUG}/rss.xml`,
    ],
  ])('builds the %s path from its slug', (_route, path, expected) => {
    expect(path).toBe(expected);
  });

  describe.each([
    ['blog index', (page?: number) => routes.blogIndex(page), '/blog'],
    [
      'topic',
      (page?: number) => routes.topic(MOCK_SLUG, page),
      `/topics/${MOCK_SLUG}`,
    ],
    [
      'tag',
      (page?: number) => routes.tag(MOCK_SLUG, page),
      `/tags/${MOCK_SLUG}`,
    ],
  ])('the %s listing', (_listing, build, firstPagePath) => {
    it('builds page 1 without a page segment', () => {
      expect([build(), build(1)]).toEqual([firstPagePath, firstPagePath]);
    });

    it('builds later pages under a page segment', () => {
      expect(build(MOCK_PAGE)).toBe(`${firstPagePath}/page/${MOCK_PAGE}`);
    });
  });

  it('builds the language-switch path with the current page encoded', () => {
    const path = routes.switchLanguage(LOCALE_ISO_CODES.NL, MOCK_CURRENT_PATH);

    expect(path).toBe(
      `/api/switch-language?to=${LOCALE_ISO_CODES.NL}&from=%2Fnl%2Fover+ons`,
    );
  });

  describe.each([
    ['confirm', routes.newsletterConfirm, '/api/newsletter/confirm'],
    ['unsubscribe', routes.newsletterUnsubscribe, NEWSLETTER_UNSUBSCRIBE_PATH],
  ])('the newsletter %s link', (_link, build, basePath) => {
    it('carries the token', () => {
      expect(build(MOCK_TOKEN)).toBe(`${basePath}?token=${MOCK_TOKEN}`);
    });

    it('carries the language the link was sent in', () => {
      expect(build(MOCK_TOKEN, LOCALE_ISO_CODES.FR)).toBe(
        `${basePath}?token=${MOCK_TOKEN}&lang=${LOCALE_ISO_CODES.FR}`,
      );
    });

    it('URL-encodes a token containing reserved query characters', () => {
      expect(build(MOCK_RESERVED_CHARACTER_TOKEN)).toBe(
        `${basePath}?token=a%20b%26c%3Dd`,
      );
    });
  });

  it.each([
    [NEWSLETTER_RESULT.CONFIRMED, '/newsletter/confirmed'],
    [NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID, '/newsletter/unsubscribe-invalid'],
  ])('builds the newsletter result page path for %s', (result, expected) => {
    expect(routes.newsletterResult(result)).toBe(expected);
  });

  it('builds the unsubscribe submit path without a token', () => {
    expect(routes.newsletterUnsubscribeSubmit()).toBe(
      NEWSLETTER_UNSUBSCRIBE_PATH,
    );
  });

  it('carries the language on the unsubscribe submit path', () => {
    expect(routes.newsletterUnsubscribeSubmit(LOCALE_ISO_CODES.FR)).toBe(
      `${NEWSLETTER_UNSUBSCRIBE_PATH}?lang=${LOCALE_ISO_CODES.FR}`,
    );
  });
});

describe(pageHref, () => {
  it.each([
    ['page_home', '/'],
    ['page_postIndex', '/blog'],
    ['page_topicIndex', '/topics'],
    ['page_tagIndex', '/tags'],
  ])('builds the static path of %s', (type, expected) => {
    expect(pageHref(type)).toBe(expected);
  });

  it.each([
    ['page_post', `/blog/${MOCK_SLUG}`],
    ['page_topic', `/topics/${MOCK_SLUG}`],
    ['page_tag', `/tags/${MOCK_SLUG}`],
    ['page_landing', `/${MOCK_SLUG}`],
  ])('builds the slugged path of %s', (type, expected) => {
    expect(pageHref(type, MOCK_SLUG)).toBe(expected);
  });

  it.each([undefined, null])(
    'has no path for a slugged type whose slug is %s',
    (slug) => {
      expect(pageHref('page_post', slug)).toBeUndefined();
    },
  );

  it.each(['settings', undefined])(
    'has no path for the unknown type %s',
    (type) => {
      expect(pageHref(type)).toBeUndefined();
    },
  );
});
