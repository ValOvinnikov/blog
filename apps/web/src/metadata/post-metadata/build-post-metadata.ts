import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getPostPage } from '@web/server/post/get-post-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for a post detail page (`/blog/{slug}`) — canonical, OG, Twitter,
 * via the shared `toMetadata` mapper. Reads the same cached `getPostPage`
 * loader the route's own `BlogPostPage` composition reads, so building
 * metadata costs no second Sanity fetch. Returns empty metadata when the
 * post doesn't exist; the route itself calls `notFound()` for the actual 404.
 */
export const buildPostMetadata = async (
  slug: string,
  tenant: string,
): Promise<Metadata> => {
  const result = await getPostPage(slug, tenant);

  if (!result.ok) {
    logger.error('post_metadata.fetch_failed', { slug, error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, publishedAt, author } = result.data;

  return toMetadata(seo, {
    canonical: routes.post(slug),
    ogType: 'article',
    article: {
      publishedTime: publishedAt,
      authors: [author.name],
    },
  });
};
