import {
  LOCALE_BCP47_TAGS,
  routes,
  type TLocaleIsoCode,
  type TValueOf,
} from '@blog/config';
import { queries } from '@blog/db';
import { service } from '@blog/service';
import type { TResult } from '@blog/utils';
import { SITEMAP_LOG } from '@web/constants/sitemap';
import { routing } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { toLanguageAlternates } from '@web/utils/to-language-alternates';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import {
  toAbsoluteAlternates,
  toLocalizedSitemapUrl,
  toTranslatedSitemapEntry,
} from '@web/utils/to-translated-sitemap-entry';
import type { MetadataRoute } from 'next';

const toEntry = (
  path: string,
  siteUrl: string,
): MetadataRoute.Sitemap[number] => {
  return {
    url: `${siteUrl}${path}`,
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

const toListOrEmpty = <T>(
  result: TResult<T[]>,
  logEvent: TValueOf<typeof SITEMAP_LOG>,
): T[] => {
  if (result.ok) {
    return result.data;
  }
  logger.error(logEvent, { error: result.error });
  return [];
};

const toPaginatedPageEntry = (
  href: string,
  language: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
  siteUrl: string,
): MetadataRoute.Sitemap[number] => {
  const url = toLocalizedSitemapUrl(href, language, defaultLocale, siteUrl);
  return {
    url,
    alternates: { languages: { [LOCALE_BCP47_TAGS[language]]: url } },
  };
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getTenantBaseUrl();
  if (!siteUrl) {
    logger.error(SITEMAP_LOG.SITE_URL_MISSING);
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
    privacyDocumentParamsResult,
    legalDocumentParamsResult,
    translationMapResult,
  ] = await Promise.all([
    service.pages.post.v1.getPostParams(tenant, liveLocales),
    service.pages.topic.v1.getTopicParams(tenant, liveLocales),
    service.pages.tag.v1.getTagParams(tenant, liveLocales),
    service.pages.topic.v1.getTopicPaginationParams(tenant, liveLocales),
    service.pages.tag.v1.getTagPaginationParams(tenant, liveLocales),
    service.pages.blog.v1.getIndexPageParams(tenant),
    service.pages.landing.v1.getPageSlugs(tenant, liveLocales),
    service.pages.sectionDocument.v1.getSectionDocumentParams(
      'page_privacyDocument',
      tenant,
      liveLocales,
    ),
    service.pages.sectionDocument.v1.getSectionDocumentParams(
      'page_legalDocument',
      tenant,
      liveLocales,
    ),
    service.global.translationMap.v1.getTranslationMap(tenant),
  ]);

  const posts = toListOrEmpty(
    postParamsResult,
    SITEMAP_LOG.POST_PARAMS_FETCH_FAILED,
  );
  const topics = toListOrEmpty(
    topicParamsResult,
    SITEMAP_LOG.TOPIC_PARAMS_FETCH_FAILED,
  );
  const tags = toListOrEmpty(
    tagParamsResult,
    SITEMAP_LOG.TAG_PARAMS_FETCH_FAILED,
  );
  const topicPages = toListOrEmpty(
    topicPaginationParamsResult,
    SITEMAP_LOG.TOPIC_PAGINATION_PARAMS_FETCH_FAILED,
  );
  const tagPages = toListOrEmpty(
    tagPaginationParamsResult,
    SITEMAP_LOG.TAG_PAGINATION_PARAMS_FETCH_FAILED,
  );
  const blogPageNumbers = toListOrEmpty(
    blogParamsResult,
    SITEMAP_LOG.BLOG_PAGE_PARAMS_FETCH_FAILED,
  ).map(({ page }) => Number(page));
  const landingPageSlugs = toListOrEmpty(
    landingPageSlugsResult,
    SITEMAP_LOG.LANDING_PAGE_SLUGS_FETCH_FAILED,
  );
  const privacyDocuments = toListOrEmpty(
    privacyDocumentParamsResult,
    SITEMAP_LOG.PRIVACY_DOCUMENT_PARAMS_FETCH_FAILED,
  );
  const legalDocuments = toListOrEmpty(
    legalDocumentParamsResult,
    SITEMAP_LOG.LEGAL_DOCUMENT_PARAMS_FETCH_FAILED,
  );

  if (!translationMapResult.ok) {
    logger.error(SITEMAP_LOG.TRANSLATION_MAP_FETCH_FAILED, {
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
        privacyIndexLanguages: [],
        legalIndexLanguages: [],
        cookieStatementLanguages: [],
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
    ...toTranslatedPageEntries(
      routes.cookieStatement(),
      translationMap.cookieStatementLanguages,
    ),
    ...blogPageNumbers.map((page) => toEntry(routes.blogIndex(page), siteUrl)),
    ...posts.map(({ publishedAt, ...page }) =>
      toTranslatedSitemapEntry({
        page,
        documentType: 'page_post',
        toHref: routes.post,
        lastModified: publishedAt,
        ...translatedPageContext,
      }),
    ),
    ...topics.map((page) =>
      toTranslatedSitemapEntry({
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
      toTranslatedSitemapEntry({
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
      toTranslatedSitemapEntry({
        page,
        documentType: 'page_landing',
        toHref: routes.landingPage,
        ...translatedPageContext,
      }),
    ),
    ...privacyDocuments.map((page) =>
      toTranslatedSitemapEntry({
        page,
        documentType: 'page_privacyDocument',
        toHref: routes.privacyDocument,
        ...translatedPageContext,
      }),
    ),
    ...legalDocuments.map((page) =>
      toTranslatedSitemapEntry({
        page,
        documentType: 'page_legalDocument',
        toHref: routes.legalDocument,
        ...translatedPageContext,
      }),
    ),
  ];
}
