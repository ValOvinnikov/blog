/**
 * @vitest-environment jsdom
 */
import { LOCALE_ISO_CODES } from '@blog/config';
import type { TFeedPost } from '@blog/service';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';

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

const request = new Request('https://example.com/rss.xml');

const paramsFor = (locale: string) =>
  Promise.resolve({ tenant: 'tenant-1', locale });

const getFeed = async (locale: string = EN) => {
  const { GET } = await import('./route');

  return GET(request, { params: paramsFor(locale) });
};

const post: TFeedPost = {
  title: 'Hello & Welcome',
  slug: 'hello-welcome',
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
};

describe('GET /[locale]/rss.xml', () => {
  beforeEach(() => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });
    getAllPublishedPostsMock.mockResolvedValue({ ok: true, data: [] });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { name: 'My Blog' } },
    });
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
      getAllPublishedPostsMock.mockResolvedValue({ ok: true, data: [post] });
    });

    it('returns a valid RSS 2.0 feed with the correct content type', async () => {
      getIndexPageMock.mockResolvedValue({
        ok: true,
        data: { seo: { description: 'A blog about things' } },
      });
      const response = await getFeed();
      const xml = await response.text();

      expect(response.headers.get('Content-Type')).toBe(
        'application/rss+xml; charset=utf-8',
      );

      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      expect(doc.querySelector('parsererror')).toBeNull();
      expect(doc.querySelector('channel > title')?.textContent).toBe('My Blog');
      expect(doc.querySelector('channel > description')?.textContent).toBe(
        'A blog about things',
      );
      expect(doc.querySelector('item > title')?.textContent).toBe(
        'Hello & Welcome',
      );
      expect(doc.querySelector('item > link')?.textContent).toBe(
        'https://example.com/blog/hello-welcome',
      );
      expect(doc.querySelector('item > description')?.textContent).toBe(
        'A <first> post.',
      );
      expect(doc.querySelector('item > pubDate')?.textContent).toBe(
        new Date(post.publishedAt).toUTCString(),
      );
    });

    it('links each item to the post in the feed language', async () => {
      const response = await getFeed(NL);
      const doc = new DOMParser().parseFromString(
        await response.text(),
        'application/xml',
      );

      expect(doc.querySelector('item > link')?.textContent).toBe(
        'https://example.com/nl/blog/hello-welcome',
      );
    });
  });

  it('falls back to a generic channel title when site settings fail', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const response = await getFeed();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > title')?.textContent).toBe('Blog');
    expect(doc.querySelector('channel > description')).toBeNull();
  });

  it('omits the channel description when the index page fails to load', async () => {
    getIndexPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });
    const response = await getFeed();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > description')).toBeNull();
  });

  it('omits the channel description when the index page has none authored', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: { seo: { description: undefined } },
    });
    const response = await getFeed();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > description')).toBeNull();
  });

  it('returns an empty feed (no items) when the posts fetch fails', async () => {
    getAllPublishedPostsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const response = await getFeed();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

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

    expect(response.status).toBe(404);
    expect(getAllPublishedPostsMock).not.toHaveBeenCalled();
  });

  it('returns a 404 without querying any content when the host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });
    const response = await getFeed();

    expect(response.status).toBe(404);
    expect(getAllPublishedPostsMock).not.toHaveBeenCalled();
  });
});
