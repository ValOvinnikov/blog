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
  getTagIndexPageMock,
  getHostTenantSanityContextMock,
  getTenantBaseUrlMock,
} = vi.hoisted(() => ({
  getPostParamsMock: vi.fn(),
  getTopicParamsMock: vi.fn(),
  getTopicPaginationParamsMock: vi.fn(),
  getTagParamsMock: vi.fn(),
  getTagPaginationParamsMock: vi.fn(),
  getIndexPageParamsMock: vi.fn(),
  getPageSlugsMock: vi.fn(),
  getTopicIndexPageMock: vi.fn(),
  getTagIndexPageMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/tenant/get-host-tenant-sanity-context', () => ({
  getHostTenantSanityContext: getHostTenantSanityContextMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
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
      landing: { v1: { getPageSlugs: getPageSlugsMock } },
      topicIndex: { v1: { getIndexPage: getTopicIndexPageMock } },
      tagIndex: { v1: { getIndexPage: getTagIndexPageMock } },
    },
  },
}));

const mockAllEmpty = () => {
  getPostParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTopicParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTagParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
  getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
  getPageSlugsMock.mockResolvedValue({ ok: true, data: [] });
  getTopicIndexPageMock.mockResolvedValue({ ok: true, data: {} });
  getTagIndexPageMock.mockResolvedValue({ ok: true, data: {} });
};

describe('sitemap', () => {
  beforeEach(() => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
    });
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

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
    getTagIndexPageMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getTenantBaseUrlMock.mockReset();
  });

  it('includes home, blog index, topics hub, post, topic, tag, blog page and landing page entries', async () => {
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

  const FAILURE_RESULT = { ok: false, error: new Error('boom') } as const;
  const EMPTY_DOCUMENT_RESULT = { ok: true, data: undefined } as const;

  it.each([
    {
      name: 'omits topic pagination pages when the fetch resolves to a failure result',
      getMock: () => getTopicPaginationParamsMock,
      result: FAILURE_RESULT,
      missingUrls: ['/topics/news/page/2'],
    },
    {
      name: 'omits tag pagination pages when the fetch resolves to a failure result',
      getMock: () => getTagPaginationParamsMock,
      result: FAILURE_RESULT,
      missingUrls: ['/tags/typescript/page/2'],
    },
    {
      name: 'omits the /blog entry and numbered blog pages when the params fetch fails',
      getMock: () => getIndexPageParamsMock,
      result: FAILURE_RESULT,
      missingUrls: ['/blog/page/2', '/blog'],
    },
    {
      name: 'omits the /topics entry when the topic index page fetch resolves to a failure result',
      getMock: () => getTopicIndexPageMock,
      result: FAILURE_RESULT,
      missingUrls: ['/topics'],
    },
    {
      name: 'omits the /topics entry when the topic index page fetch resolves ok with no document',
      getMock: () => getTopicIndexPageMock,
      result: EMPTY_DOCUMENT_RESULT,
      missingUrls: ['/topics'],
    },
    {
      name: 'omits the /tags entry when the tag index page fetch resolves to a failure result',
      getMock: () => getTagIndexPageMock,
      result: FAILURE_RESULT,
      missingUrls: ['/tags'],
    },
    {
      name: 'omits the /tags entry when the tag index page fetch resolves ok with no document',
      getMock: () => getTagIndexPageMock,
      result: EMPTY_DOCUMENT_RESULT,
      missingUrls: ['/tags'],
    },
    {
      name: 'omits landing pages when the slugs fetch fails',
      getMock: () => getPageSlugsMock,
      result: FAILURE_RESULT,
      missingUrls: ['/about'],
    },
    {
      name: 'omits posts when the post params fetch resolves to a failure result',
      getMock: () => getPostParamsMock,
      result: FAILURE_RESULT,
      missingUrls: ['/blog/first-post'],
      presentUrls: ['/blog'],
    },
    {
      name: 'omits topics when the topic params fetch resolves to a failure result',
      getMock: () => getTopicParamsMock,
      result: FAILURE_RESULT,
      missingUrls: ['/topics/news'],
    },
    {
      name: 'omits tags when the tag params fetch resolves to a failure result',
      getMock: () => getTagParamsMock,
      result: FAILURE_RESULT,
      missingUrls: ['/tags/typescript'],
    },
  ])('$name', async ({ getMock, result, missingUrls, presentUrls = [] }) => {
    mockAllEmpty();
    getMock().mockResolvedValue(result);
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    missingUrls.forEach((path) => {
      expect(urls).not.toContain(`https://example.com${path}`);
    });
    expect(urls).toContain('https://example.com/');
    presentUrls.forEach((path) => {
      expect(urls).toContain(`https://example.com${path}`);
    });
  });

  it('forwards the resolved tenant Sanity context to every loader', async () => {
    mockAllEmpty();
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    const sitemap = (await import('./sitemap')).default;

    await sitemap();

    expect(getPostParamsMock).toHaveBeenCalledWith(tenant);
    expect(getTopicIndexPageMock).toHaveBeenCalledWith(tenant);
    expect(getTagIndexPageMock).toHaveBeenCalledWith(tenant);
  });

  it('returns an empty sitemap without querying any content when the host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();

    expect(entries).toEqual([]);
    expect(getPostParamsMock).not.toHaveBeenCalled();
  });

  it('returns an empty sitemap when no tenant base URL resolves', async () => {
    getTenantBaseUrlMock.mockResolvedValue(undefined);
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();

    expect(entries).toEqual([]);
    expect(getPostParamsMock).not.toHaveBeenCalled();
  });
});
