import { queries } from '@blog/db';
import { service } from '@blog/service';
import { SITEMAP_LOG } from '@web/constants/sitemap';
import { routing } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { toListOrEmpty } from '@web/utils/to-list-or-empty';
import { toSitemapEntries } from '@web/utils/to-sitemap-entries';
import type { MetadataRoute } from 'next';

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

  return toSitemapEntries({
    translationMap,
    liveLocales,
    defaultLocale,
    siteUrl,
    lists: {
      posts: toListOrEmpty(
        postParamsResult,
        SITEMAP_LOG.POST_PARAMS_FETCH_FAILED,
      ),
      topics: toListOrEmpty(
        topicParamsResult,
        SITEMAP_LOG.TOPIC_PARAMS_FETCH_FAILED,
      ),
      tags: toListOrEmpty(tagParamsResult, SITEMAP_LOG.TAG_PARAMS_FETCH_FAILED),
      topicPages: toListOrEmpty(
        topicPaginationParamsResult,
        SITEMAP_LOG.TOPIC_PAGINATION_PARAMS_FETCH_FAILED,
      ),
      tagPages: toListOrEmpty(
        tagPaginationParamsResult,
        SITEMAP_LOG.TAG_PAGINATION_PARAMS_FETCH_FAILED,
      ),
      blogPages: toListOrEmpty(
        blogParamsResult,
        SITEMAP_LOG.BLOG_PAGE_PARAMS_FETCH_FAILED,
      ),
      landingPages: toListOrEmpty(
        landingPageSlugsResult,
        SITEMAP_LOG.LANDING_PAGE_SLUGS_FETCH_FAILED,
      ),
      privacyDocuments: toListOrEmpty(
        privacyDocumentParamsResult,
        SITEMAP_LOG.PRIVACY_DOCUMENT_PARAMS_FETCH_FAILED,
      ),
      legalDocuments: toListOrEmpty(
        legalDocumentParamsResult,
        SITEMAP_LOG.LEGAL_DOCUMENT_PARAMS_FETCH_FAILED,
      ),
    },
  });
}
