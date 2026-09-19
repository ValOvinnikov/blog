import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getPostPage } from '@web/server/post/get-post-page';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Returns empty metadata when the post doesn't exist; the route itself
 * calls `notFound()` for the actual 404.
 */
export const buildPostMetadata = async (
  slug: string,
  tenant: string,
): Promise<Metadata> => {
  const [result, tenantContext] = await Promise.all([
    getPostPage(slug, tenant),
    getTenantSanityContext(tenant),
  ]);

  if (!result.ok) {
    logger.error('post_metadata.fetch_failed', { slug, error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, publishedAt, author } = result.data;

  return toMetadata(seo, tenantContext, {
    canonical: routes.post(slug),
    ogType: 'article',
    article: {
      publishedTime: publishedAt,
      authors: [author.name],
    },
  });
};
