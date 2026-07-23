export {};

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: getTagPageMock } } },
  },
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@web/utils/env/env', () => ({
  env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
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
  author: undefined,
  categories: [],
};

const params = Promise.resolve({ slug: 'typescript' });

describe('GET /tag/[slug]/rss.xml', () => {
  afterEach(() => {
    vi.resetModules();
    getTagPageMock.mockReset();
    notFoundMock.mockClear();
  });

  it('returns a valid RSS 2.0 feed scoped to the tag with the correct content type', async () => {
    getTagPageMock.mockResolvedValue({
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
  });

  it('falls back to the tag title as the channel description when none is authored', async () => {
    getTagPageMock.mockResolvedValue({
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
    });
    const { GET } = await import('./route');

    const response = await GET(new Request('https://example.com'), { params });
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > description')?.textContent).toBe(
      'TypeScript',
    );
  });

  it('calls notFound() when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValue(null);
    const { GET } = await import('./route');

    await expect(
      GET(new Request('https://example.com'), { params }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
