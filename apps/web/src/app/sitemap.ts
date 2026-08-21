import { routes } from '@blog/config';
import { service } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { AUTHOR_ITEMS_PER_PAGE } from '@web/utils/author-items-per-page';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import { TOPIC_ITEMS_PER_PAGE } from '@web/utils/topic-items-per-page';
import type { MetadataRoute } from 'next';

// Only `getPostParams()` projects a `publishedAt` field, so `lastModified`
// stays unset for topic/tag/author/generic-page entries.
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
 * Returns an empty sitemap (logged) when `NEXT_PUBLIC_SITE_URL` is unset —
 * every URL in a sitemap must be absolute, so there is no meaningful
 * relative fallback.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    logger.error('sitemap.site_url_missing');
    return [];
  }

  const [
    postParamsResult,
    topicParamsResult,
    tagParamsResult,
    authorParamsResult,
    topicPaginationParamsResult,
    tagPaginationParamsResult,
    authorPaginationParamsResult,
    blogParamsResult,
    genericPageSlugsResult,
  ] = await Promise.all([
    service.pages.post.v1.getPostParams(),
    service.pages.topic.v1.getTopicParams(),
    service.pages.tag.v1.getTagParams(),
    service.pages.author.v1.getAuthorParams(),
    service.pages.topic.v1.getTopicPaginationParams(TOPIC_ITEMS_PER_PAGE),
    service.pages.tag.v1.getTagPaginationParams(TAG_ITEMS_PER_PAGE),
    service.pages.author.v1.getAuthorPaginationParams(AUTHOR_ITEMS_PER_PAGE),
    service.pages.blog.v1.getIndexPageParams(),
    service.pages.generic.v1.getPageSlugs(),
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

  if (!authorParamsResult.ok) {
    logger.error('sitemap.author_params_fetch_failed', {
      error: authorParamsResult.error,
    });
  }
  const authors = authorParamsResult.ok ? authorParamsResult.data : [];

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

  if (!authorPaginationParamsResult.ok) {
    logger.error('sitemap.author_pagination_params_fetch_failed', {
      error: authorPaginationParamsResult.error,
    });
  }
  const authorPages = authorPaginationParamsResult.ok
    ? authorPaginationParamsResult.data
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

  return [
    toEntry(routes.home(), siteUrl),
    toEntry(routes.blogIndex(), siteUrl),
    toEntry(routes.topics(), siteUrl),
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
    ...authors.map(({ slug }) => toEntry(routes.author(slug), siteUrl)),
    ...authorPages.map(({ slug, page }) =>
      toEntry(routes.author(slug, Number(page)), siteUrl),
    ),
    ...genericPageSlugs.map(({ slug }) =>
      toEntry(routes.genericPage(slug), siteUrl),
    ),
  ];
}
