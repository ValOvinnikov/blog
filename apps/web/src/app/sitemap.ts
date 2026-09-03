import { routes } from '@blog/config';
import { service } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { getHostTenantSanityContext } from '@web/server/tenant/get-host-tenant-sanity-context';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { logger } from '@web/utils/logger/logger';
import type { MetadataRoute } from 'next';

// Only `getPostParams()` projects a `publishedAt` field, so `lastModified`
// stays unset for topic/tag/generic-page entries.
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
        routing.locales.map((locale) => [
          locale.toLowerCase(),
          `${siteUrl}${path}`,
        ]),
      ),
    },
  };
};

/**
 * Site-wide sitemap covering every static and archive route, including
 * numbered pagination pages for consistency with the numbered `/blog/page/N`
 * entries — `itemsPerPage` here must match each route's own
 * `generateStaticParams` or the two disagree on how many pages exist.
 *
 * Returns an empty sitemap (logged) when no base URL resolves — every URL
 * in a sitemap must be absolute, so there is no meaningful relative
 * fallback.
 */
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

  const [
    postParamsResult,
    topicParamsResult,
    tagParamsResult,
    topicPaginationParamsResult,
    tagPaginationParamsResult,
    blogParamsResult,
    genericPageSlugsResult,
    topicIndexPageResult,
    tagIndexPageResult,
  ] = await Promise.all([
    service.pages.post.v1.getPostParams(tenant),
    service.pages.topic.v1.getTopicParams(tenant),
    service.pages.tag.v1.getTagParams(tenant),
    service.pages.topic.v1.getTopicPaginationParams(tenant),
    service.pages.tag.v1.getTagPaginationParams(tenant),
    service.pages.blog.v1.getIndexPageParams(tenant),
    service.pages.generic.v1.getPageSlugs(tenant),
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

  if (!genericPageSlugsResult.ok) {
    logger.error('sitemap.generic_page_slugs_fetch_failed', {
      error: genericPageSlugsResult.error,
    });
  }
  const genericPageSlugs = genericPageSlugsResult.ok
    ? genericPageSlugsResult.data
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
    // `ok: true` alone doesn't mean the document exists — the loader is nullable.
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
    ...genericPageSlugs.map(({ slug }) =>
      toEntry(routes.genericPage(slug), siteUrl),
    ),
  ];
}
