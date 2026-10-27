/**
 * @vitest-environment jsdom
 */
import {
  HTTP_STATUS,
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_FEED_POST_SLUG,
  mockFeedPost,
} from '@web/testing/shared/feed-post/fixtures';
import { parseRssFeed } from '@web/testing/shared/rss/parse-rss-feed';
import {
  MOCK_TAG_SLUG,
  mockTag,
  mockTagDetailPage,
} from '@web/testing/shared/tag/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { GET } from './route';

faker.seed(6009);

const {
  getTagPageMock,
  getPublishedPostsByTagMock,
  getHostTenantSanityContextMock,
} = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getPublishedPostsByTagMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: getTagPageMock } } },
    entities: {
      posts: {
        v1: { getPublishedPostsByTag: getPublishedPostsByTagMock },
      },
    },
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
const MOCK_TAG_DESCRIPTION = faker.lorem.sentence();
const MOCK_POST = mockFeedPost();
const TAG = mockTag({ description: undefined });

const tenant = { ...MOCK_TENANT_SANITY_CONTEXT, defaultLocale: EN };

const getFeed = (locale: string = EN) =>
  GET(new Request(MOCK_TENANT_BASE_URL), {
    params: Promise.resolve({
      tenant: MOCK_TENANT_ID,
      locale,
      slug: MOCK_TAG_SLUG,
    }),
  });

const getParsedFeed = async (locale: string = EN) => {
  const response = await getFeed(locale);

  return parseRssFeed(await response.text());
};

describe(GET, () => {
  beforeEach(() => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getTagPageMock.mockResolvedValue(okResult(mockTagDetailPage({ tag: TAG })));
    getPublishedPostsByTagMock.mockResolvedValue(okResult([MOCK_POST]));
  });

  afterEach(() => {
    getTagPageMock.mockReset();
    getPublishedPostsByTagMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
  });

  it('returns a valid RSS 2.0 feed scoped to the tag with the correct content type', async () => {
    getTagPageMock.mockResolvedValue(
      okResult(
        mockTagDetailPage({
          tag: { ...TAG, description: MOCK_TAG_DESCRIPTION },
        }),
      ),
    );

    const response = await getFeed();
    const contentType = response.headers.get('Content-Type');
    const { isWellFormed, channel, items } = parseRssFeed(
      await response.text(),
    );

    expect(contentType).toBe(RSS_CONTENT_TYPE);
    expect(isWellFormed).toBe(true);
    expect(channel.title).toBe(TAG.title);
    expect(channel.description).toBe(MOCK_TAG_DESCRIPTION);
    expect(items[0]?.title).toBe(MOCK_POST.title);
    expect(items[0]?.link).toBe(
      `${MOCK_TENANT_BASE_URL}${routes.post(MOCK_FEED_POST_SLUG)}`,
    );
  });

  it('describes the channel with the tag title when no description is authored', async () => {
    const { channel } = await getParsedFeed();

    expect(channel.description).toBe(TAG.title);
  });

  it.each([
    {
      case: 'the tag fetch fails',
      arrange: () => {
        getTagPageMock.mockResolvedValue(errorResult(MOCK_ERROR));
      },
    },
    {
      case: 'the tag does not exist',
      arrange: () => {
        getTagPageMock.mockResolvedValue(okResult());
      },
    },
  ])(
    'calls notFound() without querying posts when $case',
    async ({ arrange }) => {
      arrange();

      await expect(getFeed()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(getPublishedPostsByTagMock).not.toHaveBeenCalled();
    },
  );

  it('calls notFound() when the posts fetch fails', async () => {
    getPublishedPostsByTagMock.mockResolvedValue(errorResult(MOCK_ERROR));

    await expect(getFeed()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('does not log when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValue(okResult());

    await expect(getFeed()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  it('loads the tag and its posts in the feed language and links posts in it', async () => {
    const localizedTenant = { ...tenant, locale: NL };

    const { items } = await getParsedFeed(NL);

    expect(getTagPageMock).toHaveBeenCalledWith(MOCK_TAG_SLUG, localizedTenant);
    expect(getPublishedPostsByTagMock).toHaveBeenCalledWith(
      TAG.id,
      localizedTenant,
    );
    expect(items[0]?.link).toBe(
      `${NL_BASE_URL}${routes.post(MOCK_FEED_POST_SLUG)}`,
    );
  });

  it('carries the language and links of the feed', async () => {
    const { channel, selfLink } = await getParsedFeed(NL);

    expect(channel.language).toBe(LOCALE_BCP47_TAGS.NL);
    expect(channel.link).toBe(NL_BASE_URL);
    expect(selfLink.href).toBe(
      `${NL_BASE_URL}${routes.tagRssFeed(MOCK_TAG_SLUG)}`,
    );
  });

  it.each([
    {
      case: 'a language the site does not support',
      locale: UNSUPPORTED_LOCALE,
    },
    {
      case: 'an unresolvable host',
      locale: EN,
      arrange: () => {
        getHostTenantSanityContextMock.mockResolvedValue({
          isResolvable: false,
        });
      },
    },
  ])(
    'returns a 404 without querying content for $case',
    async ({ locale, arrange }) => {
      arrange?.();

      const response = await getFeed(locale);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(getTagPageMock).not.toHaveBeenCalled();
    },
  );
});
