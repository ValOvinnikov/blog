import { routes } from '@blog/config';
import {
  type TPostDetail,
  type TSanityProjectRef,
  urlForSanityImage,
} from '@blog/service';

export type TBlogPostingSchema = {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string | undefined;
  image: string | undefined;
  datePublished: string;
  dateModified: string;
  author: { '@type': 'Person'; name: string };
  url: string;
  keywords: string | undefined;
};

/**
 * Builds a `BlogPosting` JSON-LD schema object from a post detail view-model
 * — feed the result straight into `<JsonLd schema={...} />`.
 *
 * `dateModified` falls back to `publishedAt`: `TPostDetail` doesn't carry a
 * separate last-modified timestamp yet, so this is the best available value
 * until the service layer exposes one.
 *
 * `keywords` is a comma-separated join of the post's tag titles, `undefined`
 * when the post has none — schema.org's `keywords` accepts free-form `Text`.
 *
 * Returns `undefined` when `siteUrl` is empty, mirroring how
 * `[tenant]/[locale]/layout.tsx` treats an unresolved base URL as "no
 * `metadataBase`" rather than defaulting to `''` — schema.org's `url` must
 * be absolute, so silently concatenating an empty `siteUrl` with a relative
 * `routes.post()` path would produce an invalid (relative) `url` and fail
 * structured-data validation. Callers skip rendering `<JsonLd>` entirely
 * when this returns `undefined`.
 *
 * @example
 * const schema = buildBlogPostingSchema(post, (await getTenantBaseUrl()) ?? '', tenantContext);
 * return schema ? <JsonLd schema={schema} /> : null;
 */
export const buildBlogPostingSchema = (
  post: TPostDetail,
  siteUrl: string,
  project: TSanityProjectRef,
): TBlogPostingSchema | undefined => {
  if (!siteUrl) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.heroImage
      ? urlForSanityImage(post.heroImage, project)
      : undefined,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Person', name: post.author.name },
    url: `${siteUrl}${routes.post(post.slug)}`,
    keywords:
      post.tags.length > 0
        ? post.tags.map((tag) => tag.title).join(', ')
        : undefined,
  };
};
