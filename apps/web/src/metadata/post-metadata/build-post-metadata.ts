import { routes } from '@blog/config';
import { service } from '@blog/service';
import type { TPostDetail, TSeoResolved } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import type { Metadata } from 'next';

// Field-level fallback only (authored seo → post content) — not the full
// `resolveSeo` ladder (authored → content → site defaults) used by
// home/blog/generic, since `getPost` doesn't return site settings.
// Tracked to align in #371 once `/blog/{slug}` grows a `resolveSeo` call.
function resolvePostSeo(post: TPostDetail): TSeoResolved {
  const title = post.seo?.metaTitle ?? post.title;
  const description = post.seo?.metaDescription ?? post.excerpt;

  return {
    title,
    description,
    ogTitle: post.seo?.ogTitle ?? title,
    ogDescription: post.seo?.ogDescription ?? description,
    ogImageUrl: post.seo?.ogImageUrl ?? post.heroImageUrl,
  };
}

/**
 * Metadata for a post detail page (`/blog/{slug}`) — canonical, OG, Twitter,
 * via the shared `toMetadata` mapper. Returns empty metadata when the post
 * doesn't exist; the route itself calls `notFound()` for the actual 404.
 */
export async function buildPostMetadata(slug: string): Promise<Metadata> {
  const post = await service.pages.post.v1.getPost(slug);

  if (!post) return {};

  return toMetadata(resolvePostSeo(post), {
    canonical: routes.post(slug),
    ogType: 'article',
  });
}
