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
import type { TFeedPost } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { parseRssFeed } from '@web/testing/shared/rss/parse-rss-feed';
import { mockTag, mockTagDetailPage } from '@web/testing/shared/tag/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

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

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const POST_TITLE = 'Hello & Welcome';
const POST_SLUG = 'hello-welcome';

const post: TFeedPost = {
  title: POST_TITLE,
  slug: POST_SLUG,
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
};

const { EN, NL } = LOCALE_ISO_CODES;

const tenant = { ...MOCK_TENANT_SANITY_CONTEXT, defaultLocale: EN };

const TAG_SLUG = 'typescript';
const TAG = mockTag({ slug: TAG_SLUG, description: undefined });
const TAG_DESCRIPTION = 'The latest TypeScript posts.';

const paramsFor = (locale: string = EN) =>
  Promise.resolve({ tenant: MOCK_TENANT_ID, locale, slug: TAG_SLUG });

const getFeed = (locale?: string) =>
  GET(new Request(MOCK_TENANT_BASE_URL), { params: paramsFor(locale) });

let GET: typeof import('./route').GET;

describe('GET /[locale]/tags/[slug]/rss.xml', () => {
  let logger: typeof import('@web/utils/logger/logger').logger;

  beforeEach(async () => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getTenantBaseUrlMock.mockResolvedValue(MOCK_TENANT_BASE_URL);
    getTagPageMock.mockResolvedValue(okResult(mockTagDetailPage({ tag: TAG })));
    getPublishedPostsByTagMock.mockResolvedValue(okResult([post]));
    ({ GET } = await import('./route'));
    ({ logger } = await import('@web/utils/logger/logger'));
  });

  afterEach(() => {
    vi.resetModules();
    getTagPageMock.mockReset();
    getPublishedPostsByTagMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getTenantBaseUrlMock.mockReset();
  });

  it('returns a valid RSS 2.0 feed scoped to the tag with the correct content type', async () => {
    getTagPageMock.mockResolvedValue(
      okResult(
        mockTagDetailPage({
          tag: { ...TAG, description: TAG_DESCRIPTION },
        }),
      ),
    );
    const response = await getFeed();
    const xml = await response.text();
    const contentType = response.headers.get('Content-Type');
    const { isWellFormed, channel, items } = parseRssFeed(xml);

    expect(contentType).toBe('application/rss+xml; charset=utf-8');
    expect(isWellFormed).toBe(true);
    expect(channel.title).toBe(TAG.title);
    expect(channel.description).toBe(TAG_DESCRIPTION);
    expect(items[0]?.title).toBe(POST_TITLE);
    expect(items[0]?.link).toBe(
      `${MOCK_TENANT_BASE_URL}${routes.post(POST_SLUG)}`,
    );
    expect(getTagPageMock).toHaveBeenCalledWith(TAG_SLUG, {
      ...tenant,
      locale: EN,
    });
  });

  it('falls back to the tag title as the channel description when none is authored', async () => {
    getPublishedPostsByTagMock.mockResolvedValue(okResult([]));
    const response = await getFeed();
    const { channel } = parseRssFeed(await response.text());

    expect(channel.description).toBe(TAG.title);
  });

  it('calls notFound() when the tag fetch fails', async () => {
    getTagPageMock.mockResolvedValue(errorResult(MOCK_ERROR));

    await expect(getFeed()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(getPublishedPostsByTagMock).not.toHaveBeenCalled();
  });

  it('calls notFound() without logging when the tag simply does not exist', async () => {
    getTagPageMock.mockResolvedValue(okResult());

    await expect(getFeed()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(getPublishedPostsByTagMock).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  it('calls notFound() when the posts fetch fails', async () => {
    getPublishedPostsByTagMock.mockResolvedValue(errorResult(MOCK_ERROR));

    await expect(getFeed()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('resolves the tag and its posts in the feed language and links posts in it', async () => {
    const localizedTenant = { ...tenant, locale: NL };

    const response = await getFeed(NL);
    const { items } = parseRssFeed(await response.text());

    expect(getTagPageMock).toHaveBeenCalledWith(TAG_SLUG, localizedTenant);
    expect(getPublishedPostsByTagMock).toHaveBeenCalledWith(
      TAG.id,
      localizedTenant,
    );
    expect(items[0]?.link).toBe(
      `${MOCK_TENANT_BASE_URL}/nl${routes.post(POST_SLUG)}`,
    );
  });

  it('carries the language, home link and self link of the feed', async () => {
    const response = await getFeed(NL);
    const { channel, selfLink } = parseRssFeed(await response.text());

    expect(channel.language).toBe(LOCALE_BCP47_TAGS.NL);
    expect(channel.link).toBe(`${MOCK_TENANT_BASE_URL}/nl`);
    expect(selfLink.href).toBe(
      `${MOCK_TENANT_BASE_URL}/nl${routes.tagRssFeed(TAG_SLUG)}`,
    );
  });

  it.each([
    { case: 'a language the site does not support', locale: 'xx' },
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
    'returns a 404 without querying any content for $case',
    async ({ locale, arrange }) => {
      arrange?.();

      const response = await getFeed(locale);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(getTagPageMock).not.toHaveBeenCalled();
    },
  );
});
