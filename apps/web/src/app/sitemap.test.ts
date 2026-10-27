import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  routes,
  type TLocaleIsoCode,
} from '@blog/config';
import { queries } from '@blog/db';
import { service, type TTranslationMap } from '@blog/service';
import type * as TService from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { routing } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';

import sitemap from './sitemap';

faker.seed(6009);

const { EN, NL, DE } = LOCALE_ISO_CODES;
const X_DEFAULT = 'x-default';
const NL_PREFIX = `/${LOCALE_BCP47_TAGS.NL}`;
const DE_PREFIX = `/${LOCALE_BCP47_TAGS.DE}`;
const PUBLISHED_AT_REF_DATE = '2026-01-01T00:00:00.000Z';
const MOCK_FIRST_PUBLISHED_AT = faker.date
  .past({ refDate: PUBLISHED_AT_REF_DATE })
  .toISOString();
const MOCK_SECOND_PUBLISHED_AT = faker.date
  .past({ refDate: PUBLISHED_AT_REF_DATE })
  .toISOString();
const MOCK_FETCH_ERROR = new Error(faker.lorem.sentence());

const mockSlug = () => faker.string.alpha({ length: 10, casing: 'lower' });

const MOCK_POST_SLUG = mockSlug();
const MOCK_NL_POST_SLUG = mockSlug();
const MOCK_TOPIC_SLUG = mockSlug();
const MOCK_NL_TOPIC_SLUG = mockSlug();
const MOCK_TAG_SLUG = mockSlug();
const MOCK_NL_TAG_SLUG = mockSlug();
const MOCK_LANDING_SLUG = mockSlug();
const MOCK_NL_LANDING_SLUG = mockSlug();
const MOCK_UNTRANSLATED_LANDING_SLUG = mockSlug();

const HOME_URL = `${MOCK_TENANT_BASE_URL}${routes.home()}`;
const NL_HOME_URL = `${MOCK_TENANT_BASE_URL}${NL_PREFIX}`;
const BLOG_URL = `${MOCK_TENANT_BASE_URL}${routes.blogIndex()}`;
const NL_BLOG_URL = `${MOCK_TENANT_BASE_URL}${NL_PREFIX}${routes.blogIndex()}`;
const TOPICS_URL = `${MOCK_TENANT_BASE_URL}${routes.topics()}`;
const NL_TOPICS_URL = `${MOCK_TENANT_BASE_URL}${NL_PREFIX}${routes.topics()}`;
const TAGS_URL = `${MOCK_TENANT_BASE_URL}${routes.tags()}`;

const toUrl = (path: string, prefix = '') =>
  `${MOCK_TENANT_BASE_URL}${prefix}${path}`;

const toOwnAlternate = (language: TLocaleIsoCode, url: string) => ({
  [LOCALE_BCP47_TAGS[language]]: url,
});

const toAlternates = (
  urlByLanguage: ReadonlyArray<readonly [TLocaleIsoCode, string]>,
  defaultUrl: string,
) => ({
  ...Object.fromEntries(
    urlByLanguage.map(([language, url]) => [LOCALE_BCP47_TAGS[language], url]),
  ),
  [X_DEFAULT]: defaultUrl,
});

const mockTranslationMap = (
  overrides: Partial<TTranslationMap> = {},
): TTranslationMap => ({
  groups: [],
  homeLanguages: [],
  postIndexLanguages: [routing.defaultLocale],
  topicIndexLanguages: [routing.defaultLocale],
  tagIndexLanguages: [routing.defaultLocale],
  ...overrides,
});

const mockTranslationGroup = (
  documentType: string,
  translations: ReadonlyArray<readonly [TLocaleIsoCode, string]>,
) => translations.map(([language, slug]) => ({ documentType, language, slug }));

const POPULATED_URLS = [
  HOME_URL,
  BLOG_URL,
  TOPICS_URL,
  TAGS_URL,
  toUrl(routes.blogIndex(2)),
  toUrl(routes.blogIndex(3)),
  toUrl(routes.post(MOCK_POST_SLUG)),
  toUrl(routes.topic(MOCK_TOPIC_SLUG)),
  toUrl(routes.topic(MOCK_TOPIC_SLUG, 2)),
  toUrl(routes.tag(MOCK_TAG_SLUG)),
  toUrl(routes.tag(MOCK_TAG_SLUG, 2)),
  toUrl(routes.tag(MOCK_TAG_SLUG, 3)),
  toUrl(routes.landingPage(MOCK_LANDING_SLUG)),
];

vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({
    getHostTenantSanityContext: vi.fn(),
  }),
);

vi.mock('@blog/db', () => ({
  queries: { tenants: { selectLiveLocales: vi.fn() } },
}));

vi.mock('@blog/service', async (importOriginal) => ({
  service: {
    global: {
      translationMap: {
        v1: {
          getTranslationMap: vi.fn(),
          findTranslationGroup: (await importOriginal<typeof TService>())
            .service.global.translationMap.v1.findTranslationGroup,
        },
      },
    },
    pages: {
      post: { v1: { getPostParams: vi.fn() } },
      topic: {
        v1: { getTopicParams: vi.fn(), getTopicPaginationParams: vi.fn() },
      },
      tag: { v1: { getTagParams: vi.fn(), getTagPaginationParams: vi.fn() } },
      blog: { v1: { getIndexPageParams: vi.fn() } },
      landing: { v1: { getPageSlugs: vi.fn() } },
    },
  },
}));

const selectLiveLocales = vi.mocked(queries.tenants.selectLiveLocales);
const getPostParams = vi.mocked(service.pages.post.v1.getPostParams);
const getTopicParams = vi.mocked(service.pages.topic.v1.getTopicParams);
const getTopicPaginationParams = vi.mocked(
  service.pages.topic.v1.getTopicPaginationParams,
);
const getTagParams = vi.mocked(service.pages.tag.v1.getTagParams);
const getTagPaginationParams = vi.mocked(
  service.pages.tag.v1.getTagPaginationParams,
);
const getIndexPageParams = vi.mocked(service.pages.blog.v1.getIndexPageParams);
const getPageSlugs = vi.mocked(service.pages.landing.v1.getPageSlugs);
const getTranslationMap = vi.mocked(
  service.global.translationMap.v1.getTranslationMap,
);

const mockPopulatedLoaders = () => {
  getPostParams.mockResolvedValue(
    okResult([
      {
        slug: MOCK_POST_SLUG,
        language: EN,
        publishedAt: MOCK_FIRST_PUBLISHED_AT,
      },
    ]),
  );
  getTopicParams.mockResolvedValue(
    okResult([{ slug: MOCK_TOPIC_SLUG, language: EN }]),
  );
  getTopicPaginationParams.mockResolvedValue(
    okResult([{ slug: MOCK_TOPIC_SLUG, language: EN, page: '2' }]),
  );
  getTagParams.mockResolvedValue(
    okResult([{ slug: MOCK_TAG_SLUG, language: EN }]),
  );
  getTagPaginationParams.mockResolvedValue(
    okResult([
      { slug: MOCK_TAG_SLUG, language: EN, page: '2' },
      { slug: MOCK_TAG_SLUG, language: EN, page: '3' },
    ]),
  );
  getIndexPageParams.mockResolvedValue(
    okResult([{ page: '2' }, { page: '3' }]),
  );
  getPageSlugs.mockResolvedValue(
    okResult([{ slug: MOCK_LANDING_SLUG, language: EN }]),
  );
};

const getUrls = async () => (await sitemap()).map(({ url }) => url);

describe(sitemap, () => {
  beforeEach(() => {
    vi.mocked(getHostTenantSanityContext).mockResolvedValue({
      isResolvable: true,
      tenant: MOCK_TENANT_SANITY_CONTEXT,
    });
    selectLiveLocales.mockReturnValue([EN]);
    getPostParams.mockResolvedValue(okResult([]));
    getTopicParams.mockResolvedValue(okResult([]));
    getTopicPaginationParams.mockResolvedValue(okResult([]));
    getTagParams.mockResolvedValue(okResult([]));
    getTagPaginationParams.mockResolvedValue(okResult([]));
    getIndexPageParams.mockResolvedValue(okResult([]));
    getPageSlugs.mockResolvedValue(okResult([]));
    getTranslationMap.mockResolvedValue(okResult(mockTranslationMap()));
  });

  it('lists the static, post, topic, tag, pagination and landing entries', async () => {
    mockPopulatedLoaders();

    const urls = await getUrls();

    expect(urls).toEqual(POPULATED_URLS);
  });

  it('returns an empty sitemap without querying content when the host is unresolvable', async () => {
    vi.mocked(getHostTenantSanityContext).mockResolvedValueOnce({
      isResolvable: false,
    });

    const entries = await sitemap();

    expect(entries).toEqual([]);
    expect(getPostParams).not.toHaveBeenCalled();
  });

  it('returns an empty sitemap when no tenant base URL resolves', async () => {
    vi.mocked(getTenantBaseUrl).mockResolvedValueOnce(undefined);

    const entries = await sitemap();

    expect(entries).toEqual([]);
    expect(getPostParams).not.toHaveBeenCalled();
  });

  describe('loader requests', () => {
    const MOCK_LIVE_LOCALES = [EN, NL];

    beforeEach(() => {
      selectLiveLocales.mockReturnValue(MOCK_LIVE_LOCALES);
    });

    it.each([
      { name: 'post params', loader: getPostParams },
      { name: 'topic params', loader: getTopicParams },
      { name: 'tag params', loader: getTagParams },
      { name: 'topic pagination params', loader: getTopicPaginationParams },
      { name: 'tag pagination params', loader: getTagPaginationParams },
      { name: 'landing page slugs', loader: getPageSlugs },
    ])(
      'requests $name with the tenant context and live languages',
      async ({ loader }) => {
        await sitemap();

        expect(loader).toHaveBeenCalledWith(
          MOCK_TENANT_SANITY_CONTEXT,
          MOCK_LIVE_LOCALES,
        );
      },
    );

    it.each([
      { name: 'blog page params', loader: getIndexPageParams },
      { name: 'the translation map', loader: getTranslationMap },
    ])('requests $name with the tenant context', async ({ loader }) => {
      await sitemap();

      expect(loader).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
    });

    it('derives the live languages from the resolved tenant row', async () => {
      const tenantRow = mockTenant();
      vi.mocked(resolveRequestTenant).mockResolvedValueOnce(tenantRow);

      await sitemap();

      expect(selectLiveLocales).toHaveBeenCalledWith(tenantRow);
    });

    it('falls back to the default language when the host has no tenant row', async () => {
      vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

      const urls = await getUrls();

      expect(selectLiveLocales).not.toHaveBeenCalled();
      expect(getPageSlugs).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT, [
        routing.defaultLocale,
      ]);
      expect(urls).toContain(HOME_URL);
    });
  });

  describe('landing pages', () => {
    const NL_LANDING_URL = toUrl(
      routes.landingPage(MOCK_NL_LANDING_SLUG),
      NL_PREFIX,
    );
    const LANDING_URL = toUrl(routes.landingPage(MOCK_LANDING_SLUG));
    const UNTRANSLATED_URL = toUrl(
      routes.landingPage(MOCK_UNTRANSLATED_LANDING_SLUG),
    );
    const landingAlternates = toAlternates(
      [
        [EN, LANDING_URL],
        [NL, NL_LANDING_URL],
      ],
      LANDING_URL,
    );

    beforeEach(() => {
      selectLiveLocales.mockReturnValue([EN, NL]);
      getPageSlugs.mockResolvedValue(
        okResult([
          { slug: MOCK_LANDING_SLUG, language: EN },
          { slug: MOCK_NL_LANDING_SLUG, language: NL },
          { slug: MOCK_UNTRANSLATED_LANDING_SLUG, language: EN },
        ]),
      );
    });

    it('lists each page under its own language prefix with itself as alternate', async () => {
      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: LANDING_URL,
        alternates: { languages: toOwnAlternate(EN, LANDING_URL) },
      });
      expect(entries).toContainEqual({
        url: NL_LANDING_URL,
        alternates: { languages: toOwnAlternate(NL, NL_LANDING_URL) },
      });
    });

    describe('when translated', () => {
      beforeEach(() => {
        getTranslationMap.mockResolvedValue(
          okResult(
            mockTranslationMap({
              groups: [
                mockTranslationGroup('page_landing', [
                  [EN, MOCK_LANDING_SLUG],
                  [NL, MOCK_NL_LANDING_SLUG],
                  [DE, mockSlug()],
                ]),
              ],
            }),
          ),
        );
      });

      it('lists every live translation and the default-language x-default', async () => {
        const entries = await sitemap();

        expect(entries).toContainEqual({
          url: LANDING_URL,
          alternates: { languages: landingAlternates },
        });
        expect(entries).toContainEqual({
          url: NL_LANDING_URL,
          alternates: { languages: landingAlternates },
        });
      });

      it('keeps an untranslated page as its own language alternate', async () => {
        const entries = await sitemap();

        expect(entries).toContainEqual({
          url: UNTRANSLATED_URL,
          alternates: { languages: toOwnAlternate(EN, UNTRANSLATED_URL) },
        });
      });

      it('keeps a single-language tenant page as its own language alternate', async () => {
        selectLiveLocales.mockReturnValue([EN]);
        getPageSlugs.mockResolvedValue(
          okResult([{ slug: MOCK_LANDING_SLUG, language: EN }]),
        );

        const entries = await sitemap();

        expect(entries).toContainEqual({
          url: LANDING_URL,
          alternates: { languages: toOwnAlternate(EN, LANDING_URL) },
        });
      });

      it('keeps each page as its own language alternate when the translation map fails', async () => {
        getTranslationMap.mockResolvedValue(errorResult(MOCK_FETCH_ERROR));

        const entries = await sitemap();

        expect(entries).toContainEqual({
          url: NL_LANDING_URL,
          alternates: { languages: toOwnAlternate(NL, NL_LANDING_URL) },
        });
      });
    });
  });

  describe('Home and list pages', () => {
    const homeAlternates = toAlternates(
      [
        [EN, HOME_URL],
        [NL, NL_HOME_URL],
      ],
      HOME_URL,
    );
    const blogAlternates = toAlternates(
      [
        [EN, BLOG_URL],
        [NL, NL_BLOG_URL],
      ],
      BLOG_URL,
    );

    beforeEach(() => {
      selectLiveLocales.mockReturnValue([EN, NL]);
    });

    it('lists each live Home with every live Home as an alternate', async () => {
      getTranslationMap.mockResolvedValue(
        okResult(mockTranslationMap({ homeLanguages: [EN, NL, DE] })),
      );

      const entries = await sitemap();
      const urls = entries.map(({ url }) => url);

      expect(entries).toContainEqual({
        url: HOME_URL,
        alternates: { languages: homeAlternates },
      });
      expect(entries).toContainEqual({
        url: NL_HOME_URL,
        alternates: { languages: homeAlternates },
      });
      expect(urls).not.toContain(toUrl('', DE_PREFIX));
    });

    it('keeps the default-language Home as its own entry when no other has one', async () => {
      getTranslationMap.mockResolvedValue(
        okResult(mockTranslationMap({ homeLanguages: [EN] })),
      );

      const entries = await sitemap();
      const urls = entries.map(({ url }) => url);

      expect(entries).toContainEqual({
        url: HOME_URL,
        alternates: { languages: toOwnAlternate(EN, HOME_URL) },
      });
      expect(urls).not.toContain(NL_HOME_URL);
    });

    it('lists each live Blog list page with every live Blog list page as an alternate', async () => {
      getTranslationMap.mockResolvedValue(
        okResult(mockTranslationMap({ postIndexLanguages: [EN, NL, DE] })),
      );

      const entries = await sitemap();
      const urls = entries.map(({ url }) => url);

      expect(entries).toContainEqual({
        url: BLOG_URL,
        alternates: { languages: blogAlternates },
      });
      expect(entries).toContainEqual({
        url: NL_BLOG_URL,
        alternates: { languages: blogAlternates },
      });
      expect(urls).not.toContain(toUrl(routes.blogIndex(), DE_PREFIX));
    });

    it('lists only the languages that have each list page', async () => {
      getTranslationMap.mockResolvedValue(
        okResult(
          mockTranslationMap({
            postIndexLanguages: [EN],
            topicIndexLanguages: [NL],
            tagIndexLanguages: [],
          }),
        ),
      );

      const urls = await getUrls();

      expect(urls).toContain(BLOG_URL);
      expect(urls).toContain(NL_TOPICS_URL);
      expect(urls).not.toContain(NL_BLOG_URL);
      expect(urls).not.toContain(TOPICS_URL);
      expect(urls).not.toContain(TAGS_URL);
      expect(urls).not.toContain(toUrl(routes.tags(), NL_PREFIX));
    });
  });

  describe('Topics, Tags and posts', () => {
    beforeEach(() => {
      selectLiveLocales.mockReturnValue([EN, NL]);
    });

    it('lists each Topic and Tag under its own language prefix with live translations', async () => {
      const topicUrl = toUrl(routes.topic(MOCK_TOPIC_SLUG));
      const nlTopicUrl = toUrl(routes.topic(MOCK_NL_TOPIC_SLUG), NL_PREFIX);
      const nlTagUrl = toUrl(routes.tag(MOCK_NL_TAG_SLUG), NL_PREFIX);
      const topicAlternates = toAlternates(
        [
          [EN, topicUrl],
          [NL, nlTopicUrl],
        ],
        topicUrl,
      );
      getTopicParams.mockResolvedValue(
        okResult([
          { slug: MOCK_TOPIC_SLUG, language: EN },
          { slug: MOCK_NL_TOPIC_SLUG, language: NL },
        ]),
      );
      getTagParams.mockResolvedValue(
        okResult([{ slug: MOCK_NL_TAG_SLUG, language: NL }]),
      );
      getTranslationMap.mockResolvedValue(
        okResult(
          mockTranslationMap({
            groups: [
              mockTranslationGroup('page_topic', [
                [EN, MOCK_TOPIC_SLUG],
                [NL, MOCK_NL_TOPIC_SLUG],
              ]),
            ],
          }),
        ),
      );

      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: topicUrl,
        alternates: { languages: topicAlternates },
      });
      expect(entries).toContainEqual({
        url: nlTopicUrl,
        alternates: { languages: topicAlternates },
      });
      expect(entries).toContainEqual({
        url: nlTagUrl,
        alternates: { languages: toOwnAlternate(NL, nlTagUrl) },
      });
    });

    it('lists each post with its publish date and live translations', async () => {
      const postUrl = toUrl(routes.post(MOCK_POST_SLUG));
      const nlPostUrl = toUrl(routes.post(MOCK_NL_POST_SLUG), NL_PREFIX);
      const postAlternates = toAlternates(
        [
          [EN, postUrl],
          [NL, nlPostUrl],
        ],
        postUrl,
      );
      getPostParams.mockResolvedValue(
        okResult([
          {
            slug: MOCK_POST_SLUG,
            language: EN,
            publishedAt: MOCK_FIRST_PUBLISHED_AT,
          },
          {
            slug: MOCK_NL_POST_SLUG,
            language: NL,
            publishedAt: MOCK_SECOND_PUBLISHED_AT,
          },
        ]),
      );
      getTranslationMap.mockResolvedValue(
        okResult(
          mockTranslationMap({
            groups: [
              mockTranslationGroup('page_post', [
                [EN, MOCK_POST_SLUG],
                [NL, MOCK_NL_POST_SLUG],
              ]),
            ],
          }),
        ),
      );

      const entries = await sitemap();

      expect(entries).toContainEqual({
        url: postUrl,
        lastModified: MOCK_FIRST_PUBLISHED_AT,
        alternates: { languages: postAlternates },
      });
      expect(entries).toContainEqual({
        url: nlPostUrl,
        lastModified: MOCK_SECOND_PUBLISHED_AT,
        alternates: { languages: postAlternates },
      });
    });

    it('lists numbered Topic pages under their own language prefix', async () => {
      getTopicPaginationParams.mockResolvedValue(
        okResult([{ slug: MOCK_NL_TOPIC_SLUG, language: NL, page: '2' }]),
      );

      const urls = await getUrls();

      expect(urls).toContain(
        toUrl(routes.topic(MOCK_NL_TOPIC_SLUG, 2), NL_PREFIX),
      );
    });
  });

  describe('when a loader fails', () => {
    const NUMBERED_BLOG_URLS = [
      toUrl(routes.blogIndex(2)),
      toUrl(routes.blogIndex(3)),
    ];

    beforeEach(() => {
      mockPopulatedLoaders();
    });

    it.each([
      {
        name: 'topic pagination pages',
        loader: getTopicPaginationParams,
        omittedUrls: [toUrl(routes.topic(MOCK_TOPIC_SLUG, 2))],
      },
      {
        name: 'tag pagination pages',
        loader: getTagPaginationParams,
        omittedUrls: [
          toUrl(routes.tag(MOCK_TAG_SLUG, 2)),
          toUrl(routes.tag(MOCK_TAG_SLUG, 3)),
        ],
      },
      {
        name: 'numbered blog pages',
        loader: getIndexPageParams,
        omittedUrls: NUMBERED_BLOG_URLS,
      },
      {
        name: 'the list pages',
        loader: getTranslationMap,
        omittedUrls: [BLOG_URL, TOPICS_URL, TAGS_URL],
      },
      {
        name: 'landing page entries',
        loader: getPageSlugs,
        omittedUrls: [toUrl(routes.landingPage(MOCK_LANDING_SLUG))],
      },
      {
        name: 'posts',
        loader: getPostParams,
        omittedUrls: [toUrl(routes.post(MOCK_POST_SLUG))],
      },
      {
        name: 'topics',
        loader: getTopicParams,
        omittedUrls: [toUrl(routes.topic(MOCK_TOPIC_SLUG))],
      },
      {
        name: 'tags',
        loader: getTagParams,
        omittedUrls: [toUrl(routes.tag(MOCK_TAG_SLUG))],
      },
    ])('omits only $name', async ({ loader, omittedUrls }) => {
      loader.mockResolvedValue(errorResult(MOCK_FETCH_ERROR));

      const urls = await getUrls();

      expect(urls).toEqual(
        POPULATED_URLS.filter((url) => !omittedUrls.includes(url)),
      );
    });
  });
});
