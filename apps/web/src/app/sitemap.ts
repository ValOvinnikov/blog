import { LOCALE_BCP47_TAGS, routes, type TLocaleIsoCode } from '@blog/config';
import { queries } from '@blog/db';
import { service, type TTranslationMap } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { toLanguageAlternates } from '@web/utils/to-language-alternates';
import { toLiveLanguagePages } from '@web/utils/to-live-language-pages';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import type { MetadataRoute } from 'next';

const toEntry = (
  path: string,
  siteUrl: string,
  lastModified?: Date | string,
): MetadataRoute.Sitemap[number] => {
  return {
    url: `${siteUrl}${path}`,
    ...(lastModified ? { lastModified } : {}),
    alternates: {
      languages: Object.fromEntries(
        [routing.defaultLocale].map((locale) => [
          LOCALE_BCP47_TAGS[locale],
          `${siteUrl}${path}`,
        ]),
      ),
    },
  };
};

const toAbsoluteAlternates = (
  alternates: Record<string, string>,
  siteUrl: string,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(alternates).map(([language, path]) => [
      language,
      `${siteUrl}${path}`,
    ]),
  );

type TLanguagePageEntriesParams = {
  href: string;
  languages: readonly TLocaleIsoCode[];
  liveLocales: readonly TLocaleIsoCode[];
  defaultLocale: TLocaleIsoCode;
  siteUrl: string;
};

const toLanguagePageEntries = ({
  href,
  languages,
  liveLocales,
  defaultLocale,
  siteUrl,
}: TLanguagePageEntriesParams): MetadataRoute.Sitemap => {
  const liveLanguages = [
    ...(languages.includes(defaultLocale) ? [defaultLocale] : []),
    ...languages.filter(
      (language) =>
        language !== defaultLocale && liveLocales.includes(language),
    ),
  ];
  const toUrl = (language: TLocaleIsoCode) =>
    `${siteUrl}${toLocalizedPathname({ href, locale: language, defaultLocale })}`;

  if (liveLanguages.length < 2) {
    return liveLanguages.map((language) => ({
      url: toUrl(language),
      alternates: {
        languages: { [LOCALE_BCP47_TAGS[language]]: toUrl(language) },
      },
    }));
  }

  const alternates = toAbsoluteAlternates(
    toLanguageAlternates({
      pages: liveLanguages.map((language) => ({ language, href })),
      defaultLocale,
    }),
    siteUrl,
  );

  return liveLanguages.map((language) => ({
    url: toUrl(language),
    alternates: { languages: alternates },
  }));
};

type TTranslatedPage = { slug: string; language: TLocaleIsoCode };

type TTranslatedPageEntryParams = {
  page: TTranslatedPage;
  documentType: string;
  toHref: (slug: string) => string;
  translationMap: TTranslationMap;
  liveLocales: readonly TLocaleIsoCode[];
  defaultLocale: TLocaleIsoCode;
  siteUrl: string;
};

const toLocalizedUrl = (
  href: string,
  language: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
  siteUrl: string,
) =>
  `${siteUrl}${toLocalizedPathname({ href, locale: language, defaultLocale })}`;

const toTranslatedPageEntry = ({
  page,
  documentType,
  toHref,
  translationMap,
  liveLocales,
  defaultLocale,
  siteUrl,
}: TTranslatedPageEntryParams): MetadataRoute.Sitemap[number] => {
  const url = toLocalizedUrl(
    toHref(page.slug),
    page.language,
    defaultLocale,
    siteUrl,
  );
  const liveTranslations = toLiveLanguagePages({
    pages:
      service.global.translationMap.v1.findTranslationGroup(translationMap, {
        documentType,
        ...page,
      }) ?? [],
    liveLocales,
  });

  if (liveTranslations.length < 2) {
    return {
      url,
      alternates: { languages: { [LOCALE_BCP47_TAGS[page.language]]: url } },
    };
  }

  return {
    url,
    alternates: {
      languages: toAbsoluteAlternates(
        toLanguageAlternates({
          pages: liveTranslations.map(({ language, slug }) => ({
            language,
            href: toHref(slug),
          })),
          defaultLocale,
        }),
        siteUrl,
      ),
    },
  };
};

const toPaginatedPageEntry = (
  href: string,
  language: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
  siteUrl: string,
): MetadataRoute.Sitemap[number] => {
  const url = toLocalizedUrl(href, language, defaultLocale, siteUrl);
  return {
    url,
    alternates: { languages: { [LOCALE_BCP47_TAGS[language]]: url } },
  };
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getTenantBaseUrl();
  if (!siteUrl) {
    logger.error('sitemap.site_url_missing');
    return [];
  }

  const hostTenant = await getHostTenantSanityContext();
  if (!hostTenant.isResolvable) {
    return [];
  }
  const { tenant } = hostTenant;

  const tenantRow = await resolveRequestTenant();
  const defaultLocale = tenantRow?.locale ?? routing.defaultLocale;
  const liveLocales = tenantRow
    ? queries.tenants.selectLiveLocales(tenantRow)
    : [routing.defaultLocale];

  const [
    postParamsResult,
    topicParamsResult,
    tagParamsResult,
    topicPaginationParamsResult,
    tagPaginationParamsResult,
    blogParamsResult,
    landingPageSlugsResult,
    translationMapResult,
  ] = await Promise.all([
    service.pages.post.v1.getPostParams(tenant),
    service.pages.topic.v1.getTopicParams(tenant, liveLocales),
    service.pages.tag.v1.getTagParams(tenant, liveLocales),
    service.pages.topic.v1.getTopicPaginationParams(tenant, liveLocales),
    service.pages.tag.v1.getTagPaginationParams(tenant, liveLocales),
    service.pages.blog.v1.getIndexPageParams(tenant),
    service.pages.landing.v1.getPageSlugs(tenant, liveLocales),
    service.global.translationMap.v1.getTranslationMap(tenant),
  ]);

  if (!postParamsResult.ok) {
    logger.error('sitemap.post_params_fetch_failed', {
      error: postParamsResult.error,
    });
  }
  const posts = postParamsResult.ok ? postParamsResult.data : [];

  if (!topicParamsResult.ok) {
    logger.error('sitemap.topic_params_fetch_failed', {
      error: topicParamsResult.error,
    });
  }
  const topics = topicParamsResult.ok ? topicParamsResult.data : [];

  if (!tagParamsResult.ok) {
    logger.error('sitemap.tag_params_fetch_failed', {
      error: tagParamsResult.error,
    });
  }
  const tags = tagParamsResult.ok ? tagParamsResult.data : [];

  if (!topicPaginationParamsResult.ok) {
    logger.error('sitemap.topic_pagination_params_fetch_failed', {
      error: topicPaginationParamsResult.error,
    });
  }
  const topicPages = topicPaginationParamsResult.ok
    ? topicPaginationParamsResult.data
    : [];

  if (!tagPaginationParamsResult.ok) {
    logger.error('sitemap.tag_pagination_params_fetch_failed', {
      error: tagPaginationParamsResult.error,
    });
  }
  const tagPages = tagPaginationParamsResult.ok
    ? tagPaginationParamsResult.data
    : [];

  if (!blogParamsResult.ok) {
    logger.error('sitemap.blog_page_params_fetch_failed', {
      error: blogParamsResult.error,
    });
  }
  const blogPageNumbers = blogParamsResult.ok
    ? blogParamsResult.data.map(({ page }) => Number(page))
    : [];

  if (!landingPageSlugsResult.ok) {
    logger.error('sitemap.landing_page_slugs_fetch_failed', {
      error: landingPageSlugsResult.error,
    });
  }
  const landingPageSlugs = landingPageSlugsResult.ok
    ? landingPageSlugsResult.data
    : [];

  if (!translationMapResult.ok) {
    logger.error('sitemap.translation_map_fetch_failed', {
      error: translationMapResult.error,
    });
  }
  const translationMap = translationMapResult.ok
    ? translationMapResult.data
    : {
        groups: [],
        homeLanguages: [],
        postIndexLanguages: [],
        topicIndexLanguages: [],
        tagIndexLanguages: [],
      };
  const translatedPageContext = {
    translationMap,
    liveLocales,
    defaultLocale,
    siteUrl,
  };
  const toTranslatedPageEntries = (
    href: string,
    languages: readonly TLocaleIsoCode[],
  ) =>
    toLanguagePageEntries({
      href,
      languages,
      liveLocales,
      defaultLocale,
      siteUrl,
    });

  return [
    ...toTranslatedPageEntries(routes.home(), [
      defaultLocale,
      ...translationMap.homeLanguages,
    ]),
    ...toTranslatedPageEntries(
      routes.blogIndex(),
      translationMap.postIndexLanguages,
    ),
    ...toTranslatedPageEntries(
      routes.topics(),
      translationMap.topicIndexLanguages,
    ),
    ...toTranslatedPageEntries(routes.tags(), translationMap.tagIndexLanguages),
    ...blogPageNumbers.map((page) => toEntry(routes.blogIndex(page), siteUrl)),
    ...posts.map(({ slug, publishedAt }) =>
      toEntry(routes.post(slug), siteUrl, publishedAt),
    ),
    ...topics.map((page) =>
      toTranslatedPageEntry({
        page,
        documentType: 'page_topic',
        toHref: routes.topic,
        ...translatedPageContext,
      }),
    ),
    ...topicPages.map(({ slug, language, page }) =>
      toPaginatedPageEntry(
        routes.topic(slug, Number(page)),
        language,
        defaultLocale,
        siteUrl,
      ),
    ),
    ...tags.map((page) =>
      toTranslatedPageEntry({
        page,
        documentType: 'page_tag',
        toHref: routes.tag,
        ...translatedPageContext,
      }),
    ),
    ...tagPages.map(({ slug, language, page }) =>
      toPaginatedPageEntry(
        routes.tag(slug, Number(page)),
        language,
        defaultLocale,
        siteUrl,
      ),
    ),
    ...landingPageSlugs.map((page) =>
      toTranslatedPageEntry({
        page,
        documentType: 'page_landing',
        toHref: routes.landingPage,
        ...translatedPageContext,
      }),
    ),
  ];
}
