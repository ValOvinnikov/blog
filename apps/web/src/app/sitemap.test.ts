import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type * as TService from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { routing } from '@web/i18n/routing';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';

const FIRST_POST_SLUG = 'first-post';
const FIRST_UPDATED_AT = '2026-01-01T00:00:00.000Z';
const SECOND_UPDATED_AT = '2026-01-02T00:00:00.000Z';
const HOME_URL = 'https://example.com/';
const BLOG_URL = 'https://example.com/blog';
const TOPICS_URL = 'https://example.com/topics';
const TAGS_URL = 'https://example.com/tags';
const FIRST_POST_URL = 'https://example.com/blog/first-post';
const NEWS_TOPIC_URL = 'https://example.com/topics/news';
const ABOUT_URL = 'https://example.com/about';
const NL_ABOUT_URL = 'https://example.com/nl/over-ons';
const PRICING_URL = 'https://example.com/pricing';
const NL_HOME_URL = 'https://example.com/nl';
const NL_BLOG_URL = 'https://example.com/nl/blog';
const DESIGN_TOPIC_URL = 'https://example.com/topics/design';
const NL_DESIGN_TOPIC_URL = 'https://example.com/nl/topics/ontwerp';
const NL_TYPESCRIPT_TAG_URL = 'https://example.com/nl/tags/typescript-nl';
const ARTICLE_SLUG = 'my-article';
const NL_ARTICLE_SLUG = 'mijn-artikel';
const ARTICLE_URL = 'https://example.com/blog/my-article';
const NL_ARTICLE_URL = 'https://example.com/nl/blog/mijn-artikel';

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
          findTranslationGroup: (await importOriginal<typeof TService>())
            .service.global.translationMap.v1.findTranslationGroup,
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
  getPostParamsMock.mockResolvedValue(okResult([]));
  getTopicParamsMock.mockResolvedValue(okResult([]));
  getTopicPaginationParamsMock.mockResolvedValue(okResult([]));
  getTagParamsMock.mockResolvedValue(okResult([]));
  getTagPaginationParamsMock.mockResolvedValue(okResult([]));
  getIndexPageParamsMock.mockResolvedValue(okResult([]));
  getPageSlugsMock.mockResolvedValue(okResult([]));
  getTranslationMapMock.mockResolvedValue(okResult(makeTranslationMap()));
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
      locale: LOCALE_ISO_CODES.EN,
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
    getPostParamsMock.mockResolvedValue(
      okResult([
        {
          slug: FIRST_POST_SLUG,
          language: LOCALE_ISO_CODES.EN,
          publishedAt: FIRST_UPDATED_AT,
        },
        {
          slug: 'second-post',
          language: LOCALE_ISO_CODES.EN,
          publishedAt: SECOND_UPDATED_AT,
        },
      ]),
    );
    getTopicParamsMock.mockResolvedValue(
      okResult([{ slug: 'news', language: LOCALE_ISO_CODES.EN }]),
    );
    getTagParamsMock.mockResolvedValue(
      okResult([{ slug: 'typescript', language: LOCALE_ISO_CODES.EN }]),
    );
    getIndexPageParamsMock.mockResolvedValue(
      okResult([{ page: '2' }, { page: '3' }]),
    );
    getPageSlugsMock.mockResolvedValue(
      okResult([{ slug: 'about', language: LOCALE_ISO_CODES.EN }]),
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(HOME_URL);
    expect(urls).toContain(BLOG_URL);
    expect(urls).toContain(TOPICS_URL);
    expect(urls).toContain(TAGS_URL);
    expect(urls).toContain('https://example.com/blog/page/2');
    expect(urls).toContain('https://example.com/blog/page/3');
    expect(urls).toContain(FIRST_POST_URL);
    expect(urls).toContain('https://example.com/blog/second-post');
    expect(urls).toContain(NEWS_TOPIC_URL);
    expect(urls).toContain('https://example.com/tags/typescript');
    expect(urls).toContain(ABOUT_URL);
  });

  it('keeps a single-language tenant landing entry as its own url and language alternate', async () => {
    selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
    getPageSlugsMock.mockResolvedValue(
      okResult([{ slug: 'about', language: LOCALE_ISO_CODES.EN }]),
    );

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: ABOUT_URL,
      alternates: { languages: { en: ABOUT_URL } },
    });
  });

  it('lists each landing page under its own language prefix with that language as its alternate', async () => {
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
    getPageSlugsMock.mockResolvedValue(
      okResult([
        { slug: 'about', language: LOCALE_ISO_CODES.EN },
        { slug: 'over-ons', language: LOCALE_ISO_CODES.NL },
      ]),
    );

    const entries = await sitemap();

    expect(entries).toContainEqual(
      expect.objectContaining({
        url: ABOUT_URL,
        alternates: { languages: { en: ABOUT_URL } },
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        url: NL_ABOUT_URL,
        alternates: { languages: { nl: NL_ABOUT_URL } },
      }),
    );
  });

  const aboutTranslations = {
    homeLanguages: [],
    groups: [
      [
        {
          documentType: 'page_landing',
          language: LOCALE_ISO_CODES.EN,
          slug: 'about',
        },
        {
          documentType: 'page_landing',
          language: LOCALE_ISO_CODES.NL,
          slug: 'over-ons',
        },
        {
          documentType: 'page_landing',
          language: LOCALE_ISO_CODES.DE,
          slug: 'ueber-uns',
        },
      ],
    ],
  };
  const aboutAlternates = {
    en: ABOUT_URL,
    nl: NL_ABOUT_URL,
    'x-default': ABOUT_URL,
  };

  const mockTranslatedAbout = () => {
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
    getPageSlugsMock.mockResolvedValue(
      okResult([
        { slug: 'about', language: LOCALE_ISO_CODES.EN },
        { slug: 'over-ons', language: LOCALE_ISO_CODES.NL },
        { slug: 'pricing', language: LOCALE_ISO_CODES.EN },
      ]),
    );
    getTranslationMapMock.mockResolvedValue(
      okResult(makeTranslationMap(aboutTranslations)),
    );
  };

  describe('with a translated landing page', () => {
    beforeEach(() => {
      mockTranslatedAbout();
    });

    it("lists every live translation and the default-language x-default on each translation's entry", async () => {
      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: ABOUT_URL,
        alternates: { languages: aboutAlternates },
      });
      expect(entries).toContainEqual({
        url: NL_ABOUT_URL,
        alternates: { languages: aboutAlternates },
      });
    });

    it('keeps an untranslated landing page entry as its own language alternate', async () => {
      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: PRICING_URL,
        alternates: { languages: { en: PRICING_URL } },
      });
    });

    it('keeps a single-language tenant landing entry unchanged when its page has translations', async () => {
      selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
      getPageSlugsMock.mockResolvedValue(
        okResult([{ slug: 'about', language: LOCALE_ISO_CODES.EN }]),
      );

      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: ABOUT_URL,
        alternates: { languages: { en: ABOUT_URL } },
      });
    });

    it('keeps each landing page as its own language alternate when the translation map fetch fails', async () => {
      getTranslationMapMock.mockResolvedValue(errorResult(new Error('boom')));

      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: NL_ABOUT_URL,
        alternates: { languages: { nl: NL_ABOUT_URL } },
      });
    });
  });

  const homeAlternates = {
    en: HOME_URL,
    nl: NL_HOME_URL,
    'x-default': HOME_URL,
  };

  const mockHomes = (homeLanguages: string[]) => {
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
    getTranslationMapMock.mockResolvedValue(
      okResult(makeTranslationMap({ homeLanguages })),
    );
  };

  it('lists each live Home with every live Home as an alternate', async () => {
    mockHomes([LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.DE]);

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: HOME_URL,
      alternates: { languages: homeAlternates },
    });
    expect(entries).toContainEqual({
      url: NL_HOME_URL,
      alternates: { languages: homeAlternates },
    });
    expect(entries).not.toContainEqual(
      expect.objectContaining({ url: 'https://example.com/de' }),
    );
  });

  it('keeps the default-language Home as its own entry when no other language has one', async () => {
    mockHomes([LOCALE_ISO_CODES.EN]);

    const entries = await sitemap();

    expect(entries.filter(({ url }) => url.startsWith(NL_HOME_URL))).toEqual(
      [],
    );
    expect(entries).toContainEqual(expect.objectContaining({ url: HOME_URL }));
  });

  const mockListPages = (
    postIndexLanguages: string[],
    topicIndexLanguages: string[] = [],
    tagIndexLanguages: string[] = [],
  ) => {
    mockHomes([LOCALE_ISO_CODES.EN]);
    getTranslationMapMock.mockResolvedValue(
      okResult(
        makeTranslationMap({
          homeLanguages: [LOCALE_ISO_CODES.EN],
          postIndexLanguages,
          topicIndexLanguages,
          tagIndexLanguages,
        }),
      ),
    );
  };

  it('lists each live Blog list page with every live Blog list page as an alternate', async () => {
    mockListPages([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
      LOCALE_ISO_CODES.DE,
    ]);

    const entries = await sitemap();
    const blogAlternates = {
      en: BLOG_URL,
      nl: NL_BLOG_URL,
      'x-default': BLOG_URL,
    };

    expect(entries).toContainEqual({
      url: BLOG_URL,
      alternates: { languages: blogAlternates },
    });
    expect(entries).toContainEqual({
      url: NL_BLOG_URL,
      alternates: { languages: blogAlternates },
    });
    expect(entries).not.toContainEqual(
      expect.objectContaining({ url: 'https://example.com/de/blog' }),
    );
  });

  it('lists only the languages that have each list page', async () => {
    mockListPages([LOCALE_ISO_CODES.EN], [LOCALE_ISO_CODES.NL], []);

    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls).toContain(BLOG_URL);
    expect(urls).not.toContain(NL_BLOG_URL);
    expect(urls).toContain('https://example.com/nl/topics');
    expect(urls).not.toContain(TOPICS_URL);
    expect(urls).not.toContain(TAGS_URL);
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
    expect(entries.map((entry) => entry.url)).toContain(HOME_URL);
  });

  it('includes numbered topic and tag pagination pages', async () => {
    getTopicPaginationParamsMock.mockResolvedValue(
      okResult([{ slug: 'news', language: LOCALE_ISO_CODES.EN, page: '2' }]),
    );
    getTagPaginationParamsMock.mockResolvedValue(
      okResult([
        { slug: 'typescript', language: LOCALE_ISO_CODES.EN, page: '2' },
        { slug: 'typescript', language: LOCALE_ISO_CODES.EN, page: '3' },
      ]),
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://example.com/topics/news/page/2');
    expect(urls).toContain('https://example.com/tags/typescript/page/2');
    expect(urls).toContain('https://example.com/tags/typescript/page/3');
  });

  it('lists each Topic and Tag page under its own language prefix, with its live translations as alternates', async () => {
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
    getTopicParamsMock.mockResolvedValue(
      okResult([
        { slug: 'design', language: LOCALE_ISO_CODES.EN },
        { slug: 'ontwerp', language: LOCALE_ISO_CODES.NL },
      ]),
    );
    getTagParamsMock.mockResolvedValue(
      okResult([{ slug: 'typescript-nl', language: LOCALE_ISO_CODES.NL }]),
    );
    getTranslationMapMock.mockResolvedValue(
      okResult(
        makeTranslationMap({
          groups: [
            [
              {
                documentType: 'page_topic',
                language: LOCALE_ISO_CODES.EN,
                slug: 'design',
              },
              {
                documentType: 'page_topic',
                language: LOCALE_ISO_CODES.NL,
                slug: 'ontwerp',
              },
            ],
          ],
        }),
      ),
    );
    const topicAlternates = {
      en: DESIGN_TOPIC_URL,
      nl: NL_DESIGN_TOPIC_URL,
      'x-default': DESIGN_TOPIC_URL,
    };

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: NL_DESIGN_TOPIC_URL,
      alternates: { languages: topicAlternates },
    });
    expect(entries).toContainEqual({
      url: DESIGN_TOPIC_URL,
      alternates: { languages: topicAlternates },
    });
    expect(entries).toContainEqual({
      url: NL_TYPESCRIPT_TAG_URL,
      alternates: {
        languages: { nl: NL_TYPESCRIPT_TAG_URL },
      },
    });
  });

  it('lists each post under its own language prefix, with its live translations as alternates', async () => {
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
    getPostParamsMock.mockResolvedValue(
      okResult([
        {
          slug: ARTICLE_SLUG,
          language: LOCALE_ISO_CODES.EN,
          publishedAt: FIRST_UPDATED_AT,
        },
        {
          slug: NL_ARTICLE_SLUG,
          language: LOCALE_ISO_CODES.NL,
          publishedAt: SECOND_UPDATED_AT,
        },
      ]),
    );
    getTranslationMapMock.mockResolvedValue(
      okResult(
        makeTranslationMap({
          groups: [
            [
              {
                documentType: 'page_post',
                language: LOCALE_ISO_CODES.EN,
                slug: ARTICLE_SLUG,
              },
              {
                documentType: 'page_post',
                language: LOCALE_ISO_CODES.NL,
                slug: NL_ARTICLE_SLUG,
              },
            ],
          ],
        }),
      ),
    );
    const postAlternates = {
      en: ARTICLE_URL,
      nl: NL_ARTICLE_URL,
      'x-default': ARTICLE_URL,
    };

    const entries = await sitemap();

    expect(entries).toContainEqual({
      url: ARTICLE_URL,
      lastModified: FIRST_UPDATED_AT,
      alternates: { languages: postAlternates },
    });
    expect(entries).toContainEqual({
      url: NL_ARTICLE_URL,
      lastModified: SECOND_UPDATED_AT,
      alternates: { languages: postAlternates },
    });
  });

  it('lists numbered Topic pages under their own language prefix', async () => {
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
    getTopicPaginationParamsMock.mockResolvedValue(
      okResult([{ slug: 'ontwerp', language: LOCALE_ISO_CODES.NL, page: '2' }]),
    );

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
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);

    await sitemap();

    [
      getPostParamsMock,
      getTopicParamsMock,
      getTagParamsMock,
      getTopicPaginationParamsMock,
      getTagPaginationParamsMock,
    ].forEach((mock) => {
      expect(mock).toHaveBeenCalledWith(tenantContext, [
        LOCALE_ISO_CODES.EN,
        LOCALE_ISO_CODES.NL,
      ]);
    });
  });

  it('sets lastModified from publishedAt on posts, and not on entries without a date', async () => {
    getPostParamsMock.mockResolvedValue(
      okResult([
        {
          slug: FIRST_POST_SLUG,
          language: LOCALE_ISO_CODES.EN,
          publishedAt: FIRST_UPDATED_AT,
        },
      ]),
    );
    getTopicParamsMock.mockResolvedValue(
      okResult([{ slug: 'news', language: LOCALE_ISO_CODES.EN }]),
    );

    const entries = await sitemap();
    const postEntry = entries.find((entry) => entry.url === FIRST_POST_URL);
    const topicEntry = entries.find((entry) => entry.url === NEWS_TOPIC_URL);

    expect(postEntry?.lastModified).toBe(FIRST_UPDATED_AT);
    expect(topicEntry?.lastModified).toBeUndefined();
  });

  it('carries a languages alternate for each configured locale', async () => {
    const [homeEntry] = await sitemap();

    expect(homeEntry?.alternates?.languages).toEqual({
      en: HOME_URL,
    });
  });

  const FAILURE_RESULT = errorResult(new Error('boom'));

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
    expect(urls).toContain(HOME_URL);
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
