export {};

const { getIndexPageMock, getSiteSettingsMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
  getSiteSettingsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: { blog: { v1: { getIndexPage: getIndexPageMock } } },
    global: { siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } } },
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

describe('GET /rss.xml', () => {
  afterEach(() => {
    vi.resetModules();
    getIndexPageMock.mockReset();
    getSiteSettingsMock.mockReset();
  });

  it('returns a valid RSS 2.0 feed with the correct content type', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: { posts: [post], currentPage: 1, totalPages: 1, total: 1 },
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: {
        brand: { name: 'My Blog' },
        description: 'A blog about things',
      },
    });
    const { GET } = await import('./route');

    const response = await GET();
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

  it('aggregates posts across every blog index page', async () => {
    getIndexPageMock.mockImplementation(({ page = 1 } = {}) => {
      if (page === 1) {
        return Promise.resolve({
          ok: true,
          data: {
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
          posts: [{ ...post, slug: 'second-post', title: 'Second post' }],
          currentPage: 2,
          totalPages: 2,
          total: 2,
        },
      });
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { name: 'My Blog' }, description: 'desc' },
    });
    const { GET } = await import('./route');

    const response = await GET();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelectorAll('item')).toHaveLength(2);
    expect(getIndexPageMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to a generic channel title/description when site settings fail', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: { posts: [], currentPage: 1, totalPages: 1, total: 0 },
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const { GET } = await import('./route');

    const response = await GET();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > title')?.textContent).toBe('Blog');
    expect(doc.querySelector('channel > description')?.textContent).toBe(
      'Latest posts',
    );
  });

  it('returns an empty feed (no items) when the blog index fetch fails', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { name: 'My Blog' }, description: 'desc' },
    });
    const { GET } = await import('./route');

    const response = await GET();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelectorAll('item')).toHaveLength(0);
  });
});
