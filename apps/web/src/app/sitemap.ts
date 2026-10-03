import { LOCALE_BCP47_TAGS, routes, type TLocaleIsoCode } from '@blog/config';
import { queries } from '@blog/db';
import { service } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
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

const toLandingPageEntry = (
  { slug, language }: { slug: string; language: TLocaleIsoCode },
  defaultLocale: TLocaleIsoCode,
  siteUrl: string,
): MetadataRoute.Sitemap[number] => {
  const url = `${siteUrl}${toLocalizedPathname({
    href: routes.landingPage(slug),
    locale: language,
    defaultLocale,
  })}`;

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
    topicIndexPageResult,
    tagIndexPageResult,
  ] = await Promise.all([
    service.pages.post.v1.getPostParams(tenant),
    service.pages.topic.v1.getTopicParams(tenant),
    service.pages.tag.v1.getTagParams(tenant),
    service.pages.topic.v1.getTopicPaginationParams(tenant),
    service.pages.tag.v1.getTagPaginationParams(tenant),
    service.pages.blog.v1.getIndexPageParams(tenant),
    service.pages.landing.v1.getPageSlugs(tenant, liveLocales),
    service.pages.topicIndex.v1.getIndexPage(tenant),
    service.pages.tagIndex.v1.getIndexPage(tenant),
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

  if (!topicIndexPageResult.ok) {
    logger.error('sitemap.topic_index_page_fetch_failed', {
      error: topicIndexPageResult.error,
    });
  }

  if (!tagIndexPageResult.ok) {
    logger.error('sitemap.tag_index_page_fetch_failed', {
      error: tagIndexPageResult.error,
    });
  }

  return [
    toEntry(routes.home(), siteUrl),
    ...(blogParamsResult.ok ? [toEntry(routes.blogIndex(), siteUrl)] : []),
    ...(topicIndexPageResult.ok && topicIndexPageResult.data
      ? [toEntry(routes.topics(), siteUrl)]
      : []),
    ...(tagIndexPageResult.ok && tagIndexPageResult.data
      ? [toEntry(routes.tags(), siteUrl)]
      : []),
    ...blogPageNumbers.map((page) => toEntry(routes.blogIndex(page), siteUrl)),
    ...posts.map(({ slug, publishedAt }) =>
      toEntry(routes.post(slug), siteUrl, publishedAt),
    ),
    ...topics.map(({ slug }) => toEntry(routes.topic(slug), siteUrl)),
    ...topicPages.map(({ slug, page }) =>
      toEntry(routes.topic(slug, Number(page)), siteUrl),
    ),
    ...tags.map(({ slug }) => toEntry(routes.tag(slug), siteUrl)),
    ...tagPages.map(({ slug, page }) =>
      toEntry(routes.tag(slug, Number(page)), siteUrl),
    ),
    ...landingPageSlugs.map((page) =>
      toLandingPageEntry(page, defaultLocale, siteUrl),
    ),
  ];
}
