import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import type { Metadata } from 'next';

/**
 * Metadata for a post detail page (`/blog/{slug}`) — canonical, OG, Twitter,
 * via the shared `toMetadata` mapper. Returns empty metadata when the post
 * doesn't exist; the route itself calls `notFound()` for the actual 404.
 */
export async function buildPostMetadata(slug: string): Promise<Metadata> {
  const post = await service.pages.post.v1.getPost(slug);

  if (!post) return {};

  return toMetadata(post.seo, {
    canonical: routes.post(slug),
    ogType: 'article',
    article: {
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
    },
  });
}
