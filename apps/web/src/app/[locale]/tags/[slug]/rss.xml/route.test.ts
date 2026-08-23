/**
 * @vitest-environment jsdom
 */
import { makePostCard } from '@web/testing/shared/post/fixtures';
import { makeTagDetailPage } from '@web/testing/shared/tag/fixtures';
import { notFound } from 'next/navigation';

const { getTagPageMock, getPostListMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getPostListMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: getTagPageMock } } },
    modules: { postList: { v1: { getPostList: getPostListMock } } },
  },
}));

const post = makePostCard({
  title: 'Hello & Welcome',
  slug: 'hello-welcome',
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
});

const params = Promise.resolve({ slug: 'typescript' });

describe('GET /tags/[slug]/rss.xml', () => {
  afterEach(() => {
    vi.resetModules();
    getTagPageMock.mockReset();
    getPostListMock.mockReset();
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
    getPostListMock.mockResolvedValue({
      ok: true,
      data: { posts: [post], currentPage: 1, totalPages: 1 },
    });
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
    expect(getTagPageMock).toHaveBeenCalledWith('typescript');
    expect(getPostListMock).toHaveBeenCalledWith('post-list-1', 1);
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
    getPostListMock.mockResolvedValue({
      ok: true,
      data: { posts: [], currentPage: 1, totalPages: 1 },
    });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), { params });
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > description')?.textContent).toBe(
      'TypeScript',
    );
  });

  it('aggregates posts across every windowed post-list page', async () => {
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
    getPostListMock.mockImplementation((_id: string, page: number) => {
      if (page === 1) {
        return Promise.resolve({
          ok: true,
          data: { posts: [post], currentPage: 1, totalPages: 2 },
        });
      }
      return Promise.resolve({
        ok: true,
        data: {
          posts: [{ ...post, slug: 'second-post', title: 'Second post' }],
          currentPage: 2,
          totalPages: 2,
        },
      });
    });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), { params });
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelectorAll('item')).toHaveLength(2);
    expect(getPostListMock).toHaveBeenCalledTimes(2);
  });

  it('calls notFound() when the tag fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });
    const { GET } = await import('./route');

    await expect(
      GET(new Request('https://example.com'), { params }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(getPostListMock).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('calls notFound() when the first post-list page fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage(),
    });
    getPostListMock.mockResolvedValue({
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
});
