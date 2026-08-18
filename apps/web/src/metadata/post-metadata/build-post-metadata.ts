import { routes } from '@blog/config';
import { createLogger } from '@blog/insight';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import type { Metadata } from 'next';

const logger = createLogger();

/**
 * Metadata for a post detail page (`/blog/{slug}`) — canonical, OG, Twitter,
 * via the shared `toMetadata` mapper. Returns empty metadata when the post
 * doesn't exist; the route itself calls `notFound()` for the actual 404.
 */
export async function buildPostMetadata(slug: string): Promise<Metadata> {
  const result = await service.pages.post.v1.getPost(slug);

  if (!result.ok) {
    logger.error('post_metadata.fetch_failed', { slug, error: result.error });
    return {};
  }
  if (result.data === null) {
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
}
