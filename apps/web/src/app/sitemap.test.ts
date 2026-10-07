import { routing } from '@web/i18n/routing';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';

const {
  getPostParamsMock,
  getTopicParamsMock,
  getTopicPaginationParamsMock,
  getTagParamsMock,
  getTagPaginationParamsMock,
  getIndexPageParamsMock,
  getPageSlugsMock,
  getHostTenantSanityContextMock,
  resolveRequestTenantMock,
  selectLiveLocalesMock,
  getTranslationMapMock,
} = vi.hoisted(() => ({
  getPostParamsMock: vi.fn(),
  getTopicParamsMock: vi.fn(),
  getTopicPaginationParamsMock: vi.fn(),
  getTagParamsMock: vi.fn(),
  getTagPaginationParamsMock: vi.fn(),
  getIndexPageParamsMock: vi.fn(),
  getPageSlugsMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
  resolveRequestTenantMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
  getTranslationMapMock: vi.fn(),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { selectLiveLocales: selectLiveLocalesMock } },
}));

vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({
    getHostTenantSanityContext: getHostTenantSanityContextMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@blog/service', async (importOriginal) => ({
  service: {
    global: {
      translationMap: {
        v1: {
          getTranslationMap: getTranslationMapMock,
          findTranslationGroup: (
            await importOriginal<typeof import('@blog/service')>()
          ).service.global.translationMap.v1.findTranslationGroup,
        },
      },
    },
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
    },
  },
}));

let getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const makeTranslationMap = (overrides = {}) => ({
  groups: [],
  homeLanguages: [],
  postIndexLanguages: [routing.defaultLocale],
  topicIndexLanguages: [routing.defaultLocale],
  tagIndexLanguages: [routing.defaultLocale],
  ...overrides,
});

const mockAllEmpty = () => {
  getPostParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTopicParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTagParamsMock.mockResolvedValue({ ok: true, data: [] });
  getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
  getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
  getPageSlugsMock.mockResolvedValue({ ok: true, data: [] });
  getTranslationMapMock.mockResolvedValue({
    ok: true,
    data: makeTranslationMap(),
  });
};

describe('sitemap', () => {
  let sitemap: typeof import('./sitemap').default;

  beforeEach(async () => {
    const fresh =
      await import('@web/server/tenant/tenant-base-url/tenant-base-url');
    getTenantBaseUrlMock = vi.mocked(fresh.getTenantBaseUrl);
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
    });
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
    resolveRequestTenantMock.mockResolvedValue({
      id: 'tenant-1',
      locale: 'EN',
    });
    selectLiveLocalesMock.mockReturnValue(['en']);
    mockAllEmpty();
    sitemap = (await import('./sitemap')).default;
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
    getHostTenantSanityContextMock.mockReset();
    resolveRequestTenantMock.mockReset();
    selectLiveLocalesMock.mockReset();
    getTranslationMapMock.mockReset();
    getTenantBaseUrlMock.mockReset();
  });

  it('includes every static, post, topic, tag, blog page and landing page entry', async () => {
    getPostParamsMock.mockResolvedValue({
      ok: true,
      data: [
        {
          slug: 'first-post',
          language: 'EN',
          publishedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          slug: 'second-post',
          language: 'EN',
          publishedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });
    getTopicParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'news', language: 'EN' }],
    });
    getTagParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'typescript', language: 'EN' }],
    });
    getIndexPageParamsMock.mockResolvedValue({
      ok: true,
      data: [{ page: '2' }, { page: '3' }],
    });
    getPageSlugsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'about', language: 'EN' }],
    });

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

  it('keeps a single-language tenant landing entry as its own url and language alternate', async () => {
    selectLiveLocalesMock.mockReturnValue(['EN']);
    getPageSlugsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'about', language: 'EN' }],
    });

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: 'https://example.com/about',
      alternates: { languages: { en: 'https://example.com/about' } },
    });
  });

  it('lists each landing page under its own language prefix with that language as its alternate', async () => {
    selectLiveLocalesMock.mockReturnValue(['EN', 'NL']);
    getPageSlugsMock.mockResolvedValue({
      ok: true,
      data: [
        { slug: 'about', language: 'EN' },
        { slug: 'over-ons', language: 'NL' },
      ],
    });

    const entries = await sitemap();

    expect(entries).toContainEqual(
      expect.objectContaining({
        url: 'https://example.com/about',
        alternates: { languages: { en: 'https://example.com/about' } },
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        url: 'https://example.com/nl/over-ons',
        alternates: { languages: { nl: 'https://example.com/nl/over-ons' } },
      }),
    );
  });

  const aboutTranslations = {
    homeLanguages: [],
    groups: [
      [
        { documentType: 'page_landing', language: 'EN', slug: 'about' },
        { documentType: 'page_landing', language: 'NL', slug: 'over-ons' },
        { documentType: 'page_landing', language: 'DE', slug: 'ueber-uns' },
      ],
    ],
  };
  const aboutAlternates = {
    en: 'https://example.com/about',
    nl: 'https://example.com/nl/over-ons',
    'x-default': 'https://example.com/about',
  };

  const mockTranslatedAbout = () => {
    selectLiveLocalesMock.mockReturnValue(['EN', 'NL']);
    getPageSlugsMock.mockResolvedValue({
      ok: true,
      data: [
        { slug: 'about', language: 'EN' },
        { slug: 'over-ons', language: 'NL' },
        { slug: 'pricing', language: 'EN' },
      ],
    });
    getTranslationMapMock.mockResolvedValue({
      ok: true,
      data: makeTranslationMap(aboutTranslations),
    });
  };

  describe('with a translated landing page', () => {
    beforeEach(() => {
      mockTranslatedAbout();
    });

    it("lists every live translation and the default-language x-default on each translation's entry", async () => {
      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: 'https://example.com/about',
        alternates: { languages: aboutAlternates },
      });
      expect(entries).toContainEqual({
        url: 'https://example.com/nl/over-ons',
        alternates: { languages: aboutAlternates },
      });
    });

    it('keeps an untranslated landing page entry as its own language alternate', async () => {
      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: 'https://example.com/pricing',
        alternates: { languages: { en: 'https://example.com/pricing' } },
      });
    });

    it('keeps a single-language tenant landing entry unchanged when its page has translations', async () => {
      selectLiveLocalesMock.mockReturnValue(['EN']);
      getPageSlugsMock.mockResolvedValue({
        ok: true,
        data: [{ slug: 'about', language: 'EN' }],
      });

      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: 'https://example.com/about',
        alternates: { languages: { en: 'https://example.com/about' } },
      });
    });

    it('keeps each landing page as its own language alternate when the translation map fetch fails', async () => {
      getTranslationMapMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: 'https://example.com/nl/over-ons',
        alternates: { languages: { nl: 'https://example.com/nl/over-ons' } },
      });
    });
  });

  const homeAlternates = {
    en: 'https://example.com/',
    nl: 'https://example.com/nl',
    'x-default': 'https://example.com/',
  };

  const mockHomes = (homeLanguages: string[]) => {
    selectLiveLocalesMock.mockReturnValue(['EN', 'NL']);
    getTranslationMapMock.mockResolvedValue({
      ok: true,
      data: makeTranslationMap({ homeLanguages }),
    });
  };

  it('lists each live Home with every live Home as an alternate', async () => {
    mockHomes(['EN', 'NL', 'DE']);

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: 'https://example.com/',
      alternates: { languages: homeAlternates },
    });
    expect(entries).toContainEqual({
      url: 'https://example.com/nl',
      alternates: { languages: homeAlternates },
    });
    expect(entries).not.toContainEqual(
      expect.objectContaining({ url: 'https://example.com/de' }),
    );
  });

  it('keeps the default-language Home as its own entry when no other language has one', async () => {
    mockHomes(['EN']);

    const entries = await sitemap();

    expect(
      entries.filter(({ url }) => url.startsWith('https://example.com/nl')),
    ).toEqual([]);
    expect(entries).toContainEqual(
      expect.objectContaining({ url: 'https://example.com/' }),
    );
  });

  const mockListPages = (
    postIndexLanguages: string[],
    topicIndexLanguages: string[] = [],
    tagIndexLanguages: string[] = [],
  ) => {
    mockHomes(['EN']);
    getTranslationMapMock.mockResolvedValue({
      ok: true,
      data: makeTranslationMap({
        homeLanguages: ['EN'],
        postIndexLanguages,
        topicIndexLanguages,
        tagIndexLanguages,
      }),
    });
  };

  it('lists each live Blog list page with every live Blog list page as an alternate', async () => {
    mockListPages(['EN', 'NL', 'DE']);

    const entries = await sitemap();
    const blogAlternates = {
      en: 'https://example.com/blog',
      nl: 'https://example.com/nl/blog',
      'x-default': 'https://example.com/blog',
    };

    expect(entries).toContainEqual({
      url: 'https://example.com/blog',
      alternates: { languages: blogAlternates },
    });
    expect(entries).toContainEqual({
      url: 'https://example.com/nl/blog',
      alternates: { languages: blogAlternates },
    });
    expect(entries).not.toContainEqual(
      expect.objectContaining({ url: 'https://example.com/de/blog' }),
    );
  });

  it('lists only the languages that have each list page', async () => {
    mockListPages(['EN'], ['NL'], []);

    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls).toContain('https://example.com/blog');
    expect(urls).not.toContain('https://example.com/nl/blog');
    expect(urls).toContain('https://example.com/nl/topics');
    expect(urls).not.toContain('https://example.com/topics');
    expect(urls).not.toContain('https://example.com/tags');
    expect(urls).not.toContain('https://example.com/nl/tags');
  });

  it("requests landing page slugs with the tenant's live languages", async () => {
    const tenantRow = { id: 'tenant-1' };
    const tenantContext = { projectId: 'p' };
    resolveRequestTenantMock.mockResolvedValue(tenantRow);
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: tenantContext,
    });
    selectLiveLocalesMock.mockReturnValue(['en', 'de']);

    await sitemap();

    expect(selectLiveLocalesMock).toHaveBeenCalledWith(tenantRow);
    expect(getPageSlugsMock).toHaveBeenCalledWith(tenantContext, ['en', 'de']);
  });

  it('falls back to the default language when the host has no tenant row', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    const entries = await sitemap();

    expect(selectLiveLocalesMock).not.toHaveBeenCalled();
    expect(getPageSlugsMock).toHaveBeenCalledWith(undefined, [
      routing.defaultLocale,
    ]);
    expect(entries.map((entry) => entry.url)).toContain('https://example.com/');
  });

  it('includes numbered topic and tag pagination pages', async () => {
    getTopicPaginationParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'news', language: 'EN', page: '2' }],
    });
    getTagPaginationParamsMock.mockResolvedValue({
      ok: true,
      data: [
        { slug: 'typescript', language: 'EN', page: '2' },
        { slug: 'typescript', language: 'EN', page: '3' },
      ],
    });

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://example.com/topics/news/page/2');
    expect(urls).toContain('https://example.com/tags/typescript/page/2');
    expect(urls).toContain('https://example.com/tags/typescript/page/3');
  });

  it('lists each Topic and Tag page under its own language prefix, with its live translations as alternates', async () => {
    selectLiveLocalesMock.mockReturnValue(['EN', 'NL']);
    getTopicParamsMock.mockResolvedValue({
      ok: true,
      data: [
        { slug: 'design', language: 'EN' },
        { slug: 'ontwerp', language: 'NL' },
      ],
    });
    getTagParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'typescript-nl', language: 'NL' }],
    });
    getTranslationMapMock.mockResolvedValue({
      ok: true,
      data: makeTranslationMap({
        groups: [
          [
            { documentType: 'page_topic', language: 'EN', slug: 'design' },
            { documentType: 'page_topic', language: 'NL', slug: 'ontwerp' },
          ],
        ],
      }),
    });
    const topicAlternates = {
      en: 'https://example.com/topics/design',
      nl: 'https://example.com/nl/topics/ontwerp',
      'x-default': 'https://example.com/topics/design',
    };

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: 'https://example.com/nl/topics/ontwerp',
      alternates: { languages: topicAlternates },
    });
    expect(entries).toContainEqual({
      url: 'https://example.com/topics/design',
      alternates: { languages: topicAlternates },
    });
    expect(entries).toContainEqual({
      url: 'https://example.com/nl/tags/typescript-nl',
      alternates: {
        languages: { nl: 'https://example.com/nl/tags/typescript-nl' },
      },
    });
  });

  it('lists each post under its own language prefix, with its live translations as alternates', async () => {
    selectLiveLocalesMock.mockReturnValue(['EN', 'NL']);
    getPostParamsMock.mockResolvedValue({
      ok: true,
      data: [
        {
          slug: 'my-article',
          language: 'EN',
          publishedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          slug: 'mijn-artikel',
          language: 'NL',
          publishedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });
    getTranslationMapMock.mockResolvedValue({
      ok: true,
      data: makeTranslationMap({
        groups: [
          [
            { documentType: 'page_post', language: 'EN', slug: 'my-article' },
            { documentType: 'page_post', language: 'NL', slug: 'mijn-artikel' },
          ],
        ],
      }),
    });
    const postAlternates = {
      en: 'https://example.com/blog/my-article',
      nl: 'https://example.com/nl/blog/mijn-artikel',
      'x-default': 'https://example.com/blog/my-article',
    };

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: 'https://example.com/blog/my-article',
      lastModified: '2026-01-01T00:00:00.000Z',
      alternates: { languages: postAlternates },
    });
    expect(entries).toContainEqual({
      url: 'https://example.com/nl/blog/mijn-artikel',
      lastModified: '2026-01-02T00:00:00.000Z',
      alternates: { languages: postAlternates },
    });
  });

  it('lists numbered Topic pages under their own language prefix', async () => {
    selectLiveLocalesMock.mockReturnValue(['EN', 'NL']);
    getTopicPaginationParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'ontwerp', language: 'NL', page: '2' }],
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://example.com/nl/topics/ontwerp/page/2');
  });

  it("requests posts, Topic and Tag pages with the tenant's live languages", async () => {
    const tenantContext = { projectId: 'p' };
    resolveRequestTenantMock.mockResolvedValue({ id: 'tenant-1' });
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: tenantContext,
    });
    selectLiveLocalesMock.mockReturnValue(['EN', 'NL']);

    await sitemap();

    [
      getPostParamsMock,
      getTopicParamsMock,
      getTagParamsMock,
      getTopicPaginationParamsMock,
      getTagPaginationParamsMock,
    ].forEach((mock) => {
      expect(mock).toHaveBeenCalledWith(tenantContext, ['EN', 'NL']);
    });
  });

  it('sets lastModified from publishedAt on posts, and not on entries without a date', async () => {
    getPostParamsMock.mockResolvedValue({
      ok: true,
      data: [
        {
          slug: 'first-post',
          language: 'EN',
          publishedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    getTopicParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'news', language: 'EN' }],
    });

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
    const [homeEntry] = await sitemap();

    expect(homeEntry?.alternates?.languages).toEqual({
      en: 'https://example.com/',
    });
  });

  const FAILURE_RESULT = { ok: false, error: new Error('boom') } as const;

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
      name: 'omits numbered blog pages when the params fetch fails',
      getMock: () => getIndexPageParamsMock,
      result: FAILURE_RESULT,
      missingUrls: ['/blog/page/2'],
      presentUrls: ['/blog'],
    },
    {
      name: 'omits the list pages when the translation map fetch fails',
      getMock: () => getTranslationMapMock,
      result: FAILURE_RESULT,
      missingUrls: ['/blog', '/topics', '/tags'],
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
    getMock().mockResolvedValue(result);

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
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });

    await sitemap();

    expect(getPostParamsMock).toHaveBeenCalledWith(tenant, expect.any(Array));
  });

  it('returns an empty sitemap without querying content when the host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });

    const entries = await sitemap();

    expect(entries).toEqual([]);
    expect(getPostParamsMock).not.toHaveBeenCalled();
  });

  it('returns an empty sitemap when no tenant base URL resolves', async () => {
    getTenantBaseUrlMock.mockResolvedValue(undefined);

    const entries = await sitemap();

    expect(entries).toEqual([]);
    expect(getPostParamsMock).not.toHaveBeenCalled();
  });
});
