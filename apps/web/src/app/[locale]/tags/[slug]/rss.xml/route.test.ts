/**
 * @vitest-environment jsdom
 */
import type { TFeedPost } from '@blog/service';
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

vi.mock('@web/server/tenant/get-host-tenant-sanity-context', () => ({
  getHostTenantSanityContext: getHostTenantSanityContextMock,
}));

const post: TFeedPost = {
  title: 'Hello & Welcome',
  slug: 'hello-welcome',
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
};

const params = Promise.resolve({ slug: 'typescript' });

describe('GET /tags/[slug]/rss.xml', () => {
  beforeEach(() => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
    });
  });

  afterEach(() => {
    vi.resetModules();
    getTagPageMock.mockReset();
    getPublishedPostsByTagMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
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
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', undefined);
    expect(getPublishedPostsByTagMock).toHaveBeenCalledWith('tag-1', undefined);
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

  it('forwards the resolved tenant Sanity context to every loader', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
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

    await GET(new Request('https://example.com'), { params });

    expect(getTagPageMock).toHaveBeenCalledWith('typescript', tenant);
    expect(getPublishedPostsByTagMock).toHaveBeenCalledWith('tag-1', tenant);
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
