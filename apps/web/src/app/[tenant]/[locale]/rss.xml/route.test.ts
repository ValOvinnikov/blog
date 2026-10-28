/**
 * @vitest-environment jsdom
 */
import {
  HTTP_STATUS,
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  routes,
  SITE_MESSAGES,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { RSS_LOG } from '@web/constants/rss';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_FEED_POST_SLUG,
  mockFeedPost,
} from '@web/testing/shared/feed-post/fixtures';
import { parseRssFeed } from '@web/testing/shared/rss/parse-rss-feed';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { GET } from './route';

faker.seed(6009);

const {
  getAllPublishedPostsMock,
  getSiteSettingsMock,
  getIndexPageMock,
  getNavigationMock,
  getHostTenantSanityContextMock,
} = vi.hoisted(() => ({
  getAllPublishedPostsMock: vi.fn(),
  getSiteSettingsMock: vi.fn(),
  getIndexPageMock: vi.fn(),
  getNavigationMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      posts: { v1: { getAllPublishedPosts: getAllPublishedPostsMock } },
    },
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
      navigation: { v1: { getNavigation: getNavigationMock } },
    },
    pages: { blog: { v1: { getIndexPage: getIndexPageMock } } },
  },
}));

vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({
    getHostTenantSanityContext: getHostTenantSanityContextMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

const { EN, NL } = LOCALE_ISO_CODES;

const RSS_CONTENT_TYPE = 'application/rss+xml; charset=utf-8';
const UNSUPPORTED_LOCALE = 'xx';
const NL_BASE_URL = `${MOCK_TENANT_BASE_URL}/${LOCALE_BCP47_TAGS.NL}`;
const POST_URL = `${MOCK_TENANT_BASE_URL}${routes.post(MOCK_FEED_POST_SLUG)}`;
const FEED_URL = `${MOCK_TENANT_BASE_URL}${routes.rssFeed()}`;
const MOCK_SITE_DESCRIPTION = faker.lorem.sentence();
const MOCK_HEADER_TAGLINE = faker.lorem.words(3);
const MOCK_POST = mockFeedPost();

const tenant = { ...MOCK_TENANT_SANITY_CONTEXT, defaultLocale: EN };
const request = new Request(FEED_URL);

const getFeed = (locale: string = EN) =>
  GET(request, {
    params: Promise.resolve({ tenant: MOCK_TENANT_ID, locale }),
  });

const getParsedFeed = async (locale: string = EN) => {
  const response = await getFeed(locale);

  return parseRssFeed(await response.text());
};

const navigationWithTagline = okResult({
  items: [],
  tagline: MOCK_HEADER_TAGLINE,
});

describe(GET, () => {
  beforeEach(() => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getIndexPageMock.mockResolvedValue(okResult());
    getAllPublishedPostsMock.mockResolvedValue(okResult([]));
    getSiteSettingsMock.mockResolvedValue(okResult(MOCK_SITE_SETTINGS));
    getNavigationMock.mockResolvedValue(okResult({ items: [] }));
  });

  afterEach(() => {
    getAllPublishedPostsMock.mockReset();
    getSiteSettingsMock.mockReset();
    getIndexPageMock.mockReset();
    getNavigationMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
  });

  describe('when the feed has a post', () => {
    beforeEach(() => {
      getAllPublishedPostsMock.mockResolvedValue(okResult([MOCK_POST]));
    });

    it('returns a valid RSS 2.0 feed with the correct content type', async () => {
      getIndexPageMock.mockResolvedValue(
        okResult({ seo: mockSeo({ description: MOCK_SITE_DESCRIPTION }) }),
      );

      const response = await getFeed();
      const contentType = response.headers.get('Content-Type');
      const { isWellFormed, channel, items } = parseRssFeed(
        await response.text(),
      );

      expect(contentType).toBe(RSS_CONTENT_TYPE);
      expect(isWellFormed).toBe(true);
      expect(channel.title).toBe(MOCK_SITE_SETTINGS.brand.name);
      expect(channel.description).toBe(MOCK_SITE_DESCRIPTION);
      expect(items).toEqual([
        {
          title: MOCK_POST.title,
          link: POST_URL,
          guid: POST_URL,
          description: MOCK_POST.excerpt,
          pubDate: new Date(MOCK_POST.publishedAt).toUTCString(),
        },
      ]);
    });

    it('links each item to the post in the feed language', async () => {
      const { items } = await getParsedFeed(NL);

      expect(items[0]?.link).toBe(
        `${NL_BASE_URL}${routes.post(MOCK_FEED_POST_SLUG)}`,
      );
    });
  });

  it('falls back to generic channel copy when site settings fail', async () => {
    getSiteSettingsMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { channel } = await getParsedFeed();

    expect(channel.title).toBe(SITE_MESSAGES.rss.fallbackTitle);
    expect(channel.description).toBe(SITE_MESSAGES.rss.fallbackDescription);
  });

  it('uses the header tagline when the index page has no description', async () => {
    getIndexPageMock.mockResolvedValue(
      okResult({ seo: mockSeo({ description: undefined }) }),
    );
    getNavigationMock.mockResolvedValue(navigationWithTagline);

    const { channel } = await getParsedFeed();

    expect(channel.description).toBe(MOCK_HEADER_TAGLINE);
  });

  it('uses the header tagline when the index page fails to load', async () => {
    getIndexPageMock.mockResolvedValue(errorResult(MOCK_ERROR));
    getNavigationMock.mockResolvedValue(navigationWithTagline);

    const { channel } = await getParsedFeed();

    expect(channel.description).toBe(MOCK_HEADER_TAGLINE);
  });

  describe('when the navigation fails to load', () => {
    beforeEach(() => {
      getIndexPageMock.mockResolvedValue(errorResult(MOCK_ERROR));
      getNavigationMock.mockResolvedValue(errorResult(MOCK_ERROR));
    });

    it('falls back to the generic description', async () => {
      const { channel } = await getParsedFeed();

      expect(channel.description).toBe(SITE_MESSAGES.rss.fallbackDescription);
    });

    it('logs the failure', async () => {
      await getFeed();

      expect(logger.error).toHaveBeenCalledWith(
        RSS_LOG.NAVIGATION_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });

  it('carries the language and links of a default-language feed', async () => {
    const { channel, selfLink } = await getParsedFeed();

    expect(channel.language).toBe(LOCALE_BCP47_TAGS.EN);
    expect(channel.link).toBe(MOCK_TENANT_BASE_URL);
    expect(selfLink.href).toBe(FEED_URL);
  });

  it('carries the language and links of a prefixed feed', async () => {
    const { channel, selfLink } = await getParsedFeed(NL);

    expect(channel.language).toBe(LOCALE_BCP47_TAGS.NL);
    expect(channel.link).toBe(NL_BASE_URL);
    expect(selfLink.href).toBe(`${NL_BASE_URL}${routes.rssFeed()}`);
  });

  it('returns an empty feed when the posts fetch fails', async () => {
    getAllPublishedPostsMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { items } = await getParsedFeed();

    expect(items).toHaveLength(0);
  });

  it('loads every source in the requested language', async () => {
    await getFeed(NL);

    const localizedTenant = { ...tenant, locale: NL };

    expect(getAllPublishedPostsMock).toHaveBeenCalledWith(localizedTenant);
    expect(getSiteSettingsMock).toHaveBeenCalledWith(localizedTenant);
    expect(getIndexPageMock).toHaveBeenCalledWith(localizedTenant);
    expect(getNavigationMock).toHaveBeenCalledWith(localizedTenant);
  });

  it('returns a 404 for a language the site does not support', async () => {
    const response = await getFeed(UNSUPPORTED_LOCALE);

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getAllPublishedPostsMock).not.toHaveBeenCalled();
  });

  it('returns a 404 without querying content for an unresolvable host', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });

    const response = await getFeed();

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getAllPublishedPostsMock).not.toHaveBeenCalled();
  });
});
