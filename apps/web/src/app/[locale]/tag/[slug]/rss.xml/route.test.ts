import { notFound } from 'next/navigation';

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: getTagPageMock } } },
  },
}));

const post = {
  id: 'post-1',
  title: 'Hello & Welcome',
  slug: 'hello-welcome',
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImageUrl: undefined,
  heroImageAlt: undefined,
  heroImageSanity: undefined,
  featured: false,
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    imageUrl: undefined,
  },
  categories: [],
};

const params = Promise.resolve({ slug: 'typescript' });

describe('GET /tag/[slug]/rss.xml', () => {
  afterEach(() => {
    vi.resetModules();
    getTagPageMock.mockReset();
  });

  it('returns a valid RSS 2.0 feed scoped to the tag with the correct content type', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag: {
          id: 'tag-1',
          title: 'TypeScript',
          slug: 'typescript',
          description: 'The latest TypeScript posts.',
          seo: {
            title: 'TypeScript',
            description: 'The latest TypeScript posts.',
            ogTitle: 'TypeScript',
            ogDescription: 'The latest TypeScript posts.',
            ogImageUrl: undefined,
          },
        },
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
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
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      page: 1,
      itemsPerPage: 9,
    });
  });

  it('falls back to the tag title as the channel description when none is authored', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag: {
          id: 'tag-1',
          title: 'TypeScript',
          slug: 'typescript',
          description: undefined,
          seo: {
            title: 'TypeScript',
            description: 'TypeScript',
            ogTitle: 'TypeScript',
            ogDescription: 'TypeScript',
            ogImageUrl: undefined,
          },
        },
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), { params });
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > description')?.textContent).toBe(
      'TypeScript',
    );
  });

  it('aggregates posts across every windowed tag page', async () => {
    const tag = {
      id: 'tag-1',
      title: 'TypeScript',
      slug: 'typescript',
      description: 'The latest TypeScript posts.',
      seo: {
        title: 'TypeScript',
        description: 'The latest TypeScript posts.',
        ogTitle: 'TypeScript',
        ogDescription: 'The latest TypeScript posts.',
        ogImageUrl: undefined,
      },
    };
    getTagPageMock.mockImplementation(({ page }: { page: number }) => {
      if (page === 1) {
        return Promise.resolve({
          ok: true,
          data: {
            tag,
            posts: [post],
            currentPage: 1,
            totalPages: 2,
            total: 2,
          },
        });
      }
      return Promise.resolve({
        ok: true,
        data: {
          tag,
          posts: [{ ...post, slug: 'second-post', title: 'Second post' }],
          currentPage: 2,
          totalPages: 2,
          total: 2,
        },
      });
    });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), { params });
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelectorAll('item')).toHaveLength(2);
    expect(getTagPageMock).toHaveBeenCalledTimes(2);
  });

  it('calls notFound() when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValue({ ok: true, data: null });
    const { GET } = await import('./route');

    await expect(
      GET(new Request('https://example.com'), { params }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() when the tag fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });
    const { GET } = await import('./route');

    await expect(
      GET(new Request('https://example.com'), { params }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });
});
