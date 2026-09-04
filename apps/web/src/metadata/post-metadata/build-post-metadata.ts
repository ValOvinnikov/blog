import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for a post detail page (`/blog/{slug}`) — canonical, OG, Twitter,
 * via the shared `toMetadata` mapper. Returns empty metadata when the post
 * doesn't exist; the route itself calls `notFound()` for the actual 404.
 */
export const buildPostMetadata = async (
  slug: string,
  tenant: string,
): Promise<Metadata> => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.pages.post.v1.getPost(slug, tenantContext);

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
