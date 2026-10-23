/**
 * @vitest-environment jsdom
 */
import { HTTP_STATUS, LOCALE_ISO_CODES } from '@blog/config';
import type { TFeedPost } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getRssSelfLink } from '@web/testing/shared/rss/get-rss-self-link';

const FEED_URL = 'https://example.com/rss.xml';
const XML_CONTENT_TYPE = 'application/xml';
const ESCAPED_POST_TITLE = 'Hello & Welcome';
const ESCAPED_POST_EXCERPT = 'A <first> post.';
const BASE_URL = 'https://example.com';
const SITE_DESCRIPTION = 'A blog about things';
const CHANNEL_TITLE_SELECTOR = 'channel > title';
const CHANNEL_DESCRIPTION_SELECTOR = 'channel > description';
const ITEM_LINK_SELECTOR = 'item > link';
const SITE_TAGLINE = 'Notes · Essays';
const CHANNEL_LANGUAGE_SELECTOR = 'channel > language';
const CHANNEL_LINK_SELECTOR = 'channel > link';

const {
  getAllPublishedPostsMock,
  getSiteSettingsMock,
  getIndexPageMock,
  getHostTenantSanityContextMock,
} = vi.hoisted(() => ({
  getAllPublishedPostsMock: vi.fn(),
  getSiteSettingsMock: vi.fn(),
  getIndexPageMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      posts: { v1: { getAllPublishedPosts: getAllPublishedPostsMock } },
    },
    global: { siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } } },
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

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const { EN, NL } = LOCALE_ISO_CODES;

const tenant = {
  projectId: 'tenant-project',
  dataset: 'production',
  token: 'tenant-token',
  defaultLocale: EN,
};

const request = new Request(FEED_URL);

const paramsFor = (locale: string) =>
  Promise.resolve({ tenant: 'tenant-1', locale });

const getFeed = async (locale: string = EN) => {
  const { GET } = await import('./route');

  return GET(request, { params: paramsFor(locale) });
};

const getFeedDocument = async (locale: string = EN) =>
  new DOMParser().parseFromString(
    await (await getFeed(locale)).text(),
    XML_CONTENT_TYPE,
  );

const post: TFeedPost = {
  title: ESCAPED_POST_TITLE,
  slug: 'hello-welcome',
  excerpt: ESCAPED_POST_EXCERPT,
  publishedAt: '2026-01-15T00:00:00Z',
};

describe('GET /[locale]/rss.xml', () => {
  beforeEach(() => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getTenantBaseUrlMock.mockResolvedValue(BASE_URL);
    getIndexPageMock.mockResolvedValue(okResult());
    getAllPublishedPostsMock.mockResolvedValue(okResult([]));
    getSiteSettingsMock.mockResolvedValue(
      okResult({ brand: { name: 'My Blog' } }),
    );
  });

  afterEach(() => {
    vi.resetModules();
    getAllPublishedPostsMock.mockReset();
    getSiteSettingsMock.mockReset();
    getIndexPageMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getTenantBaseUrlMock.mockReset();
  });

  describe('when the feed has a post', () => {
    beforeEach(() => {
      getAllPublishedPostsMock.mockResolvedValue(okResult([post]));
    });

    it('returns a valid RSS 2.0 feed with the correct content type', async () => {
      getIndexPageMock.mockResolvedValue(
        okResult({ seo: { description: SITE_DESCRIPTION } }),
      );
      const response = await getFeed();
      const xml = await response.text();

      expect(response.headers.get('Content-Type')).toBe(
        'application/rss+xml; charset=utf-8',
      );

      const doc = new DOMParser().parseFromString(xml, XML_CONTENT_TYPE);
      expect(doc.querySelector('parsererror')).toBeNull();
      expect(doc.querySelector(CHANNEL_TITLE_SELECTOR)?.textContent).toBe(
        'My Blog',
      );
      expect(doc.querySelector(CHANNEL_DESCRIPTION_SELECTOR)?.textContent).toBe(
        SITE_DESCRIPTION,
      );
      expect(doc.querySelector('item > title')?.textContent).toBe(
        ESCAPED_POST_TITLE,
      );
      expect(doc.querySelector(ITEM_LINK_SELECTOR)?.textContent).toBe(
        'https://example.com/blog/hello-welcome',
      );
      expect(doc.querySelector('item > description')?.textContent).toBe(
        ESCAPED_POST_EXCERPT,
      );
      expect(doc.querySelector('item > pubDate')?.textContent).toBe(
        new Date(post.publishedAt).toUTCString(),
      );
    });

    it('links each item to the post in the feed language', async () => {
      const response = await getFeed(NL);
      const doc = new DOMParser().parseFromString(
        await response.text(),
        XML_CONTENT_TYPE,
      );

      expect(doc.querySelector(ITEM_LINK_SELECTOR)?.textContent).toBe(
        'https://example.com/nl/blog/hello-welcome',
      );
    });
  });

  it('falls back to a generic channel title and description when site settings fail', async () => {
    getSiteSettingsMock.mockResolvedValue(errorResult(new Error('boom')));
    const doc = await getFeedDocument();

    expect(doc.querySelector(CHANNEL_TITLE_SELECTOR)?.textContent).toBe('Blog');
    expect(doc.querySelector(CHANNEL_DESCRIPTION_SELECTOR)?.textContent).toBe(
      'The latest posts.',
    );
  });

  it('describes the channel with the brand tagline when the index page has no description', async () => {
    getIndexPageMock.mockResolvedValue(
      okResult({ seo: { description: undefined } }),
    );
    getSiteSettingsMock.mockResolvedValue(
      okResult({ brand: { name: 'My Blog', tagline: SITE_TAGLINE } }),
    );
    const doc = await getFeedDocument();

    expect(doc.querySelector(CHANNEL_DESCRIPTION_SELECTOR)?.textContent).toBe(
      SITE_TAGLINE,
    );
  });

  it('describes the channel with the brand tagline when the index page fails to load', async () => {
    getIndexPageMock.mockResolvedValue(errorResult(new Error('boom')));
    getSiteSettingsMock.mockResolvedValue(
      okResult({ brand: { name: 'My Blog', tagline: SITE_TAGLINE } }),
    );
    const doc = await getFeedDocument();

    expect(doc.querySelector(CHANNEL_DESCRIPTION_SELECTOR)?.textContent).toBe(
      SITE_TAGLINE,
    );
  });

  it('carries the language, home link and self link of an unprefixed default-language feed', async () => {
    const doc = await getFeedDocument();

    expect(doc.querySelector(CHANNEL_LANGUAGE_SELECTOR)?.textContent).toBe(
      'en',
    );
    expect(doc.querySelector(CHANNEL_LINK_SELECTOR)?.textContent).toBe(
      BASE_URL,
    );
    expect(getRssSelfLink(doc)?.getAttribute('href')).toBe(FEED_URL);
  });

  it('carries the language, home link and self link of a prefixed feed', async () => {
    const doc = await getFeedDocument(NL);

    expect(doc.querySelector(CHANNEL_LANGUAGE_SELECTOR)?.textContent).toBe(
      'nl',
    );
    expect(doc.querySelector(CHANNEL_LINK_SELECTOR)?.textContent).toBe(
      'https://example.com/nl',
    );
    expect(getRssSelfLink(doc)?.getAttribute('href')).toBe(
      'https://example.com/nl/rss.xml',
    );
  });

  it('returns an empty feed (no items) when the posts fetch fails', async () => {
    getAllPublishedPostsMock.mockResolvedValue(errorResult(new Error('boom')));
    const response = await getFeed();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, XML_CONTENT_TYPE);

    expect(doc.querySelectorAll('item')).toHaveLength(0);
  });

  it('forwards the tenant Sanity context in the requested language to every loader', async () => {
    await getFeed(NL);

    const localizedTenant = { ...tenant, locale: NL };
    expect(getAllPublishedPostsMock).toHaveBeenCalledWith(localizedTenant);
    expect(getSiteSettingsMock).toHaveBeenCalledWith(localizedTenant);
    expect(getIndexPageMock).toHaveBeenCalledWith(localizedTenant);
  });

  it('returns a 404 for a language the site does not support', async () => {
    const response = await getFeed('xx');

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getAllPublishedPostsMock).not.toHaveBeenCalled();
  });

  it('returns a 404 without querying any content when the host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });
    const response = await getFeed();

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getAllPublishedPostsMock).not.toHaveBeenCalled();
  });
});
