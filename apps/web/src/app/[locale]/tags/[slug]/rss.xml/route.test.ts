/**
 * @vitest-environment jsdom
 */
import type { TFeedPost } from '@blog/service';
import { makeTagDetailPage } from '@web/testing/shared/tag/fixtures';
import { notFound } from 'next/navigation';

const { getTagPageMock, getAllPublishedPostsMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getAllPublishedPostsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: getTagPageMock } } },
    entities: {
      posts: { v1: { getAllPublishedPosts: getAllPublishedPostsMock } },
    },
  },
}));

const post: TFeedPost = {
  title: 'Hello & Welcome',
  slug: 'hello-welcome',
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
};

const params = Promise.resolve({ slug: 'typescript' });

describe('GET /tags/[slug]/rss.xml', () => {
  afterEach(() => {
    vi.resetModules();
    getTagPageMock.mockReset();
    getAllPublishedPostsMock.mockReset();
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
    getAllPublishedPostsMock.mockResolvedValue({ ok: true, data: [post] });
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
    getAllPublishedPostsMock.mockResolvedValue({ ok: true, data: [] });
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
    expect(getAllPublishedPostsMock).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('calls notFound() when the posts fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage(),
    });
    getAllPublishedPostsMock.mockResolvedValue({
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
