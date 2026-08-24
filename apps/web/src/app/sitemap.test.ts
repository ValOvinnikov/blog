export {};

const {
  getPostParamsMock,
  getTopicParamsMock,
  getTopicPaginationParamsMock,
  getTagParamsMock,
  getTagPaginationParamsMock,
  getIndexPageParamsMock,
  getPageSlugsMock,
  getTopicIndexPageMock,
} = vi.hoisted(() => ({
  getPostParamsMock: vi.fn(),
  getTopicParamsMock: vi.fn(),
  getTopicPaginationParamsMock: vi.fn(),
  getTagParamsMock: vi.fn(),
  getTagPaginationParamsMock: vi.fn(),
  getIndexPageParamsMock: vi.fn(),
  getPageSlugsMock: vi.fn(),
  getTopicIndexPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      post: { v1: { getPostParams: getPostParamsMock } },
      topic: {
        v1: {
          getTopicParams: getTopicParamsMock,
          getTopicPaginationParams: getTopicPaginationParamsMock,
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
      topicIndex: { v1: { getIndexPage: getTopicIndexPageMock } },
    },
  },
}));

vi.mock('@web/utils/env/env', () => ({
  env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
}));

/** Resolves every params mock to an empty result; tests override as needed. */
const mockAllEmpty = () => {
  getPostParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTopicParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTagParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
  getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
  getPageSlugsMock.mockResolvedValue({ ok: true, data: [] });
  getTopicIndexPageMock.mockResolvedValue({ ok: true, data: {} });
};

describe('sitemap', () => {
  afterEach(() => {
    vi.resetModules();
    getPostParamsMock.mockReset();
    getTopicParamsMock.mockReset();
    getTopicPaginationParamsMock.mockReset();
    getTagParamsMock.mockReset();
    getTagPaginationParamsMock.mockReset();
    getIndexPageParamsMock.mockReset();
    getPageSlugsMock.mockReset();
    getTopicIndexPageMock.mockReset();
  });

  it('includes home, blog index, topics hub, post, topic, tag, blog page and generic page entries', async () => {
    mockAllEmpty();
    getPostParamsMock.mockResolvedValue({
      ok: true,
      data: [
        { slug: 'first-post', publishedAt: '2026-01-01T00:00:00.000Z' },
        { slug: 'second-post', publishedAt: '2026-01-02T00:00:00.000Z' },
      ],
    });
    getTopicParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'news' }],
    });
    getTagParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'typescript' }],
    });
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
    expect(urls).toContain('https://example.com/tags');
    expect(urls).toContain('https://example.com/blog/page/2');
    expect(urls).toContain('https://example.com/blog/page/3');
    expect(urls).toContain('https://example.com/blog/first-post');
    expect(urls).toContain('https://example.com/blog/second-post');
    expect(urls).toContain('https://example.com/topics/news');
    expect(urls).toContain('https://example.com/tags/typescript');
    expect(urls).toContain('https://example.com/about');
  });

  it('includes numbered topic and tag pagination pages', async () => {
    mockAllEmpty();
    getTopicPaginationParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'news', page: '2' }],
    });
    getTagPaginationParamsMock.mockResolvedValue({
      ok: true,
      data: [
        { slug: 'typescript', page: '2' },
        { slug: 'typescript', page: '3' },
      ],
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://example.com/topics/news/page/2');
    expect(urls).toContain('https://example.com/tags/typescript/page/2');
    expect(urls).toContain('https://example.com/tags/typescript/page/3');
  });

  it('omits topic pagination pages when the fetch resolves to a failure result', async () => {
    mockAllEmpty();
    getTopicPaginationParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/topics/news/page/2');
    expect(urls).toContain('https://example.com/');
  });

  it('omits tag pagination pages when the fetch resolves to a failure result', async () => {
    mockAllEmpty();
    getTagPaginationParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/tags/typescript/page/2');
    expect(urls).toContain('https://example.com/');
  });

  it('sets lastModified on post entries from publishedAt, but not on entries without a date source', async () => {
    mockAllEmpty();
    getPostParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'first-post', publishedAt: '2026-01-01T00:00:00.000Z' }],
    });
    getTopicParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'news' }],
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const postEntry = entries.find(
      (entry) => entry.url === 'https://example.com/blog/first-post',
    );
    const topicEntry = entries.find(
      (entry) => entry.url === 'https://example.com/topics/news',
    );

    expect(postEntry?.lastModified).toBe('2026-01-01T00:00:00.000Z');
    expect(topicEntry?.lastModified).toBeUndefined();
  });

  it('carries a languages alternate for each configured locale', async () => {
    mockAllEmpty();
    const sitemap = (await import('./sitemap')).default;

    const [homeEntry] = await sitemap();

    expect(homeEntry?.alternates?.languages).toEqual({
      en: 'https://example.com/',
    });
  });

  it('omits the /blog entry and numbered blog pages when the params fetch fails', async () => {
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
    expect(urls).not.toContain('https://example.com/blog');
  });

  it('omits the /topics entry when the topic index page fetch resolves to a failure result', async () => {
    mockAllEmpty();
    getTopicIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/topics');
    expect(urls).toContain('https://example.com/');
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

  it('omits posts when the post params fetch resolves to a failure result', async () => {
    mockAllEmpty();
    getPostParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/blog/first-post');
    expect(urls).toContain('https://example.com/');
    expect(urls).toContain('https://example.com/blog');
  });

  it('omits topics when the topic params fetch resolves to a failure result', async () => {
    mockAllEmpty();
    getTopicParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/topics/news');
    expect(urls).toContain('https://example.com/');
  });

  it('omits tags when the tag params fetch resolves to a failure result', async () => {
    mockAllEmpty();
    getTagParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/tags/typescript');
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
