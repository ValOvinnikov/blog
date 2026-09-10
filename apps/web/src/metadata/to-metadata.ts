import type { TSeoResolved } from '@blog/service';
import type { Metadata } from 'next';

type TToMetadataOptions = {
  canonical: string;
  ogType: 'website' | 'article';
  titleAbsolute?: boolean;
  /** RSS feed URL for this page's content scope (site-wide or per-tag). Omit when no feed covers this page. */
  feedUrl?: string;
  article?: {
    publishedTime?: string;
    authors?: string[];
  };
};

/**
 * Maps an authored `TSeoResolved` view-model to Next `Metadata` — the one
 * shared place routes turn service SEO output into `title`, `description`,
 * `alternates.canonical`, `openGraph`, and `twitter`. Every field but
 * `title` is optional and, when absent, is passed through as `undefined`
 * rather than substituted — Next's per-segment merge (`resolve-metadata.js`'s
 * `mergeMetadata`) treats an explicit `undefined` as "clear this field", not
 * "inherit the parent segment's value", which is what keeps an unauthored
 * field from silently picking up the root layout's site-wide description.
 *
 * @example
 * return toMetadata(result.data.seo, { canonical: '/', ogType: 'website', titleAbsolute: true });
 */
export const toMetadata = (
  seo: TSeoResolved,
  opts: TToMetadataOptions,
): Metadata => {
  const { canonical, ogType, titleAbsolute, feedUrl, article } = opts;
  const ogImages = seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined;
  const twitterImages = seo.ogImageUrl ? [seo.ogImageUrl] : undefined;

  return {
    title: titleAbsolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates: {
      canonical,
      ...(feedUrl && { types: { 'application/rss+xml': feedUrl } }),
    },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: ogImages,
      type: ogType,
      ...(article?.publishedTime && { publishedTime: article.publishedTime }),
      ...(article?.authors && { authors: article.authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: twitterImages,
    },
  };
};
