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

// Route-relative fallbacks to the file-convention-derived default images
// (`app/opengraph-image.tsx` / `app/twitter-image.tsx`). Next resolves a
// relative image URL against `metadataBase` (set once, in `[tenant]/[locale]/layout.tsx`'s
// `generateMetadata`) when building the final `<meta>` tags.
//
// This fallback is required, not optional: Next's per-segment metadata merge
// does not deep-merge object-type fields like `openGraph`/`twitter` — a leaf
// segment's own `openGraph` key wholesale *replaces* the root segment's
// (`resolve-metadata.js`'s `mergeMetadata`, case `'openGraph'`), including
// whatever file-convention image Next would otherwise have auto-injected
// there. Every route calls `toMetadata`, so every route sets its own
// `openGraph`/`twitter` — meaning the root's auto-injected image is always
// discarded unless this function supplies an explicit replacement itself.
const FALLBACK_OG_IMAGE_PATH = '/opengraph-image';
const FALLBACK_TWITTER_IMAGE_PATH = '/twitter-image';

/**
 * Maps a fully-resolved `TSeoResolved` view-model to Next `Metadata` —
 * the one shared place routes turn service SEO output into `title`,
 * `description`, `alternates.canonical`, `openGraph`, and `twitter`.
 *
 * @example
 * return toMetadata(result.data.seo, { canonical: '/', ogType: 'website', titleAbsolute: true });
 */
export const toMetadata = (
  seo: TSeoResolved,
  opts: TToMetadataOptions,
): Metadata => {
  const { canonical, ogType, titleAbsolute, feedUrl, article } = opts;
  const ogImages = seo.ogImageUrl
    ? [{ url: seo.ogImageUrl }]
    : [{ url: FALLBACK_OG_IMAGE_PATH }];
  const twitterImages = seo.ogImageUrl
    ? [seo.ogImageUrl]
    : [FALLBACK_TWITTER_IMAGE_PATH];

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
