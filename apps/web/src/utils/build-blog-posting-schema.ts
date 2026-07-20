import { routes } from '@blog/config';
import type { TPostDetail } from '@blog/service';

export type TBlogPostingSchema = {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  image: string | undefined;
  datePublished: string;
  dateModified: string;
  author: { '@type': 'Person'; name: string } | undefined;
  url: string;
};

/**
 * Builds a `BlogPosting` JSON-LD schema object from a post detail view-model
 * — feed the result straight into `<JsonLd schema={...} />`.
 *
 * `dateModified` falls back to `publishedAt`: `TPostDetail` doesn't carry a
 * separate last-modified timestamp yet, so this is the best available value
 * until the service layer exposes one.
 *
 * Returns `undefined` when `siteUrl` is empty, mirroring how
 * `[locale]/layout.tsx` treats a missing `NEXT_PUBLIC_SITE_URL` as "no
 * `metadataBase`" rather than defaulting to `''` — schema.org's `url` must
 * be absolute, so silently concatenating an empty `siteUrl` with a relative
 * `routes.post()` path would produce an invalid (relative) `url` and fail
 * structured-data validation. Callers skip rendering `<JsonLd>` entirely
 * when this returns `undefined`.
 *
 * @example
 * const schema = buildBlogPostingSchema(post, env.NEXT_PUBLIC_SITE_URL ?? '');
 * return schema ? <JsonLd schema={schema} /> : null;
 */
export function buildBlogPostingSchema(
  post: TPostDetail,
  siteUrl: string,
): TBlogPostingSchema | undefined {
  if (!siteUrl) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.heroImageUrl,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: post.author
      ? { '@type': 'Person', name: post.author.name }
      : undefined,
    url: `${siteUrl}${routes.post(post.slug)}`,
  };
}
