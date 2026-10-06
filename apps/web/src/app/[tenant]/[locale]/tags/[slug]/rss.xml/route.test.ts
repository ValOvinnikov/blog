/**
 * @vitest-environment jsdom
 */
import { LOCALE_ISO_CODES } from '@blog/config';
import type { TFeedPost } from '@blog/service';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { makeTagDetailPage } from '@web/testing/shared/tag/fixtures';
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

const post: TFeedPost = {
  title: 'Hello & Welcome',
  slug: 'hello-welcome',
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
};

const { EN, NL } = LOCALE_ISO_CODES;

const tenant = {
  projectId: 'tenant-project',
  dataset: 'production',
  token: 'tenant-token',
  defaultLocale: EN,
};

const paramsFor = (locale: string = EN) =>
  Promise.resolve({ tenant: 'tenant-1', locale, slug: 'typescript' });

const params = paramsFor();

describe('GET /[locale]/tags/[slug]/rss.xml', () => {
  beforeEach(() => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  afterEach(() => {
    vi.resetModules();
    getTagPageMock.mockReset();
    getPublishedPostsByTagMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getTenantBaseUrlMock.mockReset();
  });

  it('returns a valid RSS 2.0 feed scoped to the tag with the correct content type', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({
        tag: {
          id: 'tag-1',
          title: 'TypeScript',
          slug: 'typescript',
          description: 'The latest TypeScript posts.',
        },
      }),
    });
    getPublishedPostsByTagMock.mockResolvedValue({ ok: true, data: [post] });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), { params });
    const xml = await response.text();

    expect(response.headers.get('Content-Type')).toBe(
      'application/rss+xml; charset=utf-8',
    );

    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelector('channel > title')?.textContent).toBe(
      'TypeScript',
    );
    expect(doc.querySelector('channel > description')?.textContent).toBe(
      'The latest TypeScript posts.',
    );
    expect(doc.querySelector('item > title')?.textContent).toBe(
      'Hello & Welcome',
    );
    expect(doc.querySelector('item > link')?.textContent).toBe(
      'https://example.com/blog/hello-welcome',
    );
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      ...tenant,
      locale: EN,
    });
  });

  it('falls back to the tag title as the channel description when none is authored', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({
        tag: {
          id: 'tag-1',
          title: 'TypeScript',
          slug: 'typescript',
          description: undefined,
        },
      }),
    });
    getPublishedPostsByTagMock.mockResolvedValue({ ok: true, data: [] });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), { params });
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > description')?.textContent).toBe(
      'TypeScript',
    );
  });

  it('calls notFound() when the tag fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });
    const { GET } = await import('./route');

    await expect(
      GET(new Request('https://example.com'), { params }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(getPublishedPostsByTagMock).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the tag simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({ ok: true, data: undefined });
    const { GET } = await import('./route');

    await expect(
      GET(new Request('https://example.com'), { params }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(getPublishedPostsByTagMock).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('calls notFound() when the posts fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage(),
    });
    getPublishedPostsByTagMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const { GET } = await import('./route');

    await expect(
      GET(new Request('https://example.com'), { params }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('resolves the tag and its posts in the feed language and links posts in it', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({
        tag: {
          id: 'tag-1',
          title: 'TypeScript',
          slug: 'typescript',
          description: undefined,
        },
      }),
    });
    getPublishedPostsByTagMock.mockResolvedValue({ ok: true, data: [post] });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), {
      params: paramsFor(NL),
    });
    const doc = new DOMParser().parseFromString(
      await response.text(),
      'application/xml',
    );

    const localizedTenant = { ...tenant, locale: NL };
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', localizedTenant);
    expect(getPublishedPostsByTagMock).toHaveBeenCalledWith(
      'tag-1',
      localizedTenant,
    );
    expect(doc.querySelector('item > link')?.textContent).toBe(
      'https://example.com/nl/blog/hello-welcome',
    );
  });

  it('returns a 404 for a language the site does not support', async () => {
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), {
      params: paramsFor('xx'),
    });

    expect(response.status).toBe(404);
    expect(getTagPageMock).not.toHaveBeenCalled();
  });

  it('returns a 404 without querying any content when the host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), {
      params,
    });

    expect(response.status).toBe(404);
    expect(getTagPageMock).not.toHaveBeenCalled();
  });
});
