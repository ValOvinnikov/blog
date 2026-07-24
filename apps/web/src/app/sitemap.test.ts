export {};

const {
  getPostParamsMock,
  getCategoryParamsMock,
  getCategoryPaginationParamsMock,
  getTagParamsMock,
  getTagPaginationParamsMock,
  getAuthorParamsMock,
  getAuthorPaginationParamsMock,
  getIndexPageParamsMock,
  getPageSlugsMock,
} = vi.hoisted(() => ({
  getPostParamsMock: vi.fn(),
  getCategoryParamsMock: vi.fn(),
  getCategoryPaginationParamsMock: vi.fn(),
  getTagParamsMock: vi.fn(),
  getTagPaginationParamsMock: vi.fn(),
  getAuthorParamsMock: vi.fn(),
  getAuthorPaginationParamsMock: vi.fn(),
  getIndexPageParamsMock: vi.fn(),
  getPageSlugsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      post: { v1: { getPostParams: getPostParamsMock } },
      category: {
        v1: {
          getCategoryParams: getCategoryParamsMock,
          getCategoryPaginationParams: getCategoryPaginationParamsMock,
        },
      },
      tag: {
        v1: {
          getTagParams: getTagParamsMock,
          getTagPaginationParams: getTagPaginationParamsMock,
        },
      },
      blog: { v1: { getIndexPageParams: getIndexPageParamsMock } },
      generic: { v1: { getPageSlugs: getPageSlugsMock } },
      author: {
        v1: {
          getAuthorParams: getAuthorParamsMock,
          getAuthorPaginationParams: getAuthorPaginationParamsMock,
        },
      },
    },
  },
}));

vi.mock('@web/utils/env/env', () => ({
  env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
}));

/** Resolves every params mock to an empty result; tests override as needed. */
function mockAllEmpty() {
  getPostParamsMock.mockResolvedValue([]);
  getCategoryParamsMock.mockResolvedValue([]);
  getCategoryPaginationParamsMock.mockResolvedValue([]);
  getTagParamsMock.mockResolvedValue([]);
  getTagPaginationParamsMock.mockResolvedValue([]);
  getAuthorParamsMock.mockResolvedValue([]);
  getAuthorPaginationParamsMock.mockResolvedValue([]);
  getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
  getPageSlugsMock.mockResolvedValue({ ok: true, data: [] });
}

describe('sitemap', () => {
  afterEach(() => {
    vi.resetModules();
    getPostParamsMock.mockReset();
    getCategoryParamsMock.mockReset();
    getCategoryPaginationParamsMock.mockReset();
    getTagParamsMock.mockReset();
    getTagPaginationParamsMock.mockReset();
    getAuthorParamsMock.mockReset();
    getAuthorPaginationParamsMock.mockReset();
    getIndexPageParamsMock.mockReset();
    getPageSlugsMock.mockReset();
  });

  it('includes home, blog index, topics hub, post, category, tag, author, blog page and generic page entries', async () => {
    mockAllEmpty();
    getPostParamsMock.mockResolvedValue([
      { slug: 'first-post', publishedAt: '2026-01-01T00:00:00.000Z' },
      { slug: 'second-post', publishedAt: '2026-01-02T00:00:00.000Z' },
    ]);
    getCategoryParamsMock.mockResolvedValue([{ slug: 'news' }]);
    getTagParamsMock.mockResolvedValue([{ slug: 'typescript' }]);
    getAuthorParamsMock.mockResolvedValue([{ slug: 'jane-doe' }]);
    getIndexPageParamsMock.mockResolvedValue({
      ok: true,
      data: [{ page: '2' }, { page: '3' }],
    });
    getPageSlugsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'about' }],
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://example.com/');
    expect(urls).toContain('https://example.com/blog');
    expect(urls).toContain('https://example.com/topics');
    expect(urls).toContain('https://example.com/blog/page/2');
    expect(urls).toContain('https://example.com/blog/page/3');
    expect(urls).toContain('https://example.com/blog/first-post');
    expect(urls).toContain('https://example.com/blog/second-post');
    expect(urls).toContain('https://example.com/category/news');
    expect(urls).toContain('https://example.com/tag/typescript');
    expect(urls).toContain('https://example.com/author/jane-doe');
    expect(urls).toContain('https://example.com/about');
  });

  it('includes numbered category, tag and author pagination pages', async () => {
    mockAllEmpty();
    getCategoryPaginationParamsMock.mockResolvedValue([
      { slug: 'news', page: '2' },
    ]);
    getTagPaginationParamsMock.mockResolvedValue([
      { slug: 'typescript', page: '2' },
      { slug: 'typescript', page: '3' },
    ]);
    getAuthorPaginationParamsMock.mockResolvedValue([
      { slug: 'jane-doe', page: '2' },
    ]);
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://example.com/category/news/page/2');
    expect(urls).toContain('https://example.com/tag/typescript/page/2');
    expect(urls).toContain('https://example.com/tag/typescript/page/3');
    expect(urls).toContain('https://example.com/author/jane-doe/page/2');
  });

  it('omits category pagination pages when the fetch throws', async () => {
    mockAllEmpty();
    getCategoryPaginationParamsMock.mockRejectedValue(new Error('boom'));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/category/news/page/2');
    expect(urls).toContain('https://example.com/');
  });

  it('omits tag pagination pages when the fetch throws', async () => {
    mockAllEmpty();
    getTagPaginationParamsMock.mockRejectedValue(new Error('boom'));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/tag/typescript/page/2');
    expect(urls).toContain('https://example.com/');
  });

  it('omits authors when the author params fetch throws', async () => {
    mockAllEmpty();
    getAuthorParamsMock.mockRejectedValue(new Error('boom'));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/author/jane-doe');
    expect(urls).toContain('https://example.com/');
  });

  it('omits author pagination pages when the fetch throws', async () => {
    mockAllEmpty();
    getAuthorPaginationParamsMock.mockRejectedValue(new Error('boom'));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/author/jane-doe/page/2');
    expect(urls).toContain('https://example.com/');
  });

  it('sets lastModified on post entries from publishedAt, but not on entries without a date source', async () => {
    mockAllEmpty();
    getPostParamsMock.mockResolvedValue([
      { slug: 'first-post', publishedAt: '2026-01-01T00:00:00.000Z' },
    ]);
    getCategoryParamsMock.mockResolvedValue([{ slug: 'news' }]);
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const postEntry = entries.find(
      (entry) => entry.url === 'https://example.com/blog/first-post',
    );
    const categoryEntry = entries.find(
      (entry) => entry.url === 'https://example.com/category/news',
    );

    expect(postEntry?.lastModified).toBe('2026-01-01T00:00:00.000Z');
    expect(categoryEntry?.lastModified).toBeUndefined();
  });

  it('carries a languages alternate for each configured locale', async () => {
    mockAllEmpty();
    const sitemap = (await import('./sitemap')).default;

    const [homeEntry] = await sitemap();

    expect(homeEntry?.alternates?.languages).toEqual({
      en: 'https://example.com/',
    });
  });

  it('omits numbered blog pages when the params fetch fails', async () => {
    mockAllEmpty();
    getIndexPageParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/blog/page/2');
    expect(urls).toContain('https://example.com/');
    expect(urls).toContain('https://example.com/blog');
  });

  it('omits generic pages when the slugs fetch fails', async () => {
    mockAllEmpty();
    getPageSlugsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/about');
    expect(urls).toContain('https://example.com/');
  });

  it('omits posts when the post params fetch throws', async () => {
    mockAllEmpty();
    getPostParamsMock.mockRejectedValue(new Error('boom'));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/blog/first-post');
    expect(urls).toContain('https://example.com/');
    expect(urls).toContain('https://example.com/blog');
  });

  it('omits categories when the category params fetch throws', async () => {
    mockAllEmpty();
    getCategoryParamsMock.mockRejectedValue(new Error('boom'));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/category/news');
    expect(urls).toContain('https://example.com/');
  });

  it('omits tags when the tag params fetch throws', async () => {
    mockAllEmpty();
    getTagParamsMock.mockRejectedValue(new Error('boom'));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/tag/typescript');
    expect(urls).toContain('https://example.com/');
  });

  it('returns an empty sitemap when NEXT_PUBLIC_SITE_URL is unset', async () => {
    vi.doMock('@web/utils/env/env', () => ({ env: {} }));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();

    expect(entries).toEqual([]);
    expect(getPostParamsMock).not.toHaveBeenCalled();
  });
});
