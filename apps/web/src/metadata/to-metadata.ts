import type { TSeoResolved } from '@blog/service';
import type { Metadata } from 'next';

type TToMetadataOptions = {
  canonical: string;
  ogType: 'website' | 'article';
  titleAbsolute?: boolean;
};

/**
 * Maps a fully-resolved `TSeoResolved` view-model to Next `Metadata` —
 * the one shared place routes turn service SEO output into `title`,
 * `description`, `alternates.canonical`, `openGraph`, and `twitter`.
 *
 * @example
 * return toMetadata(result.data.seo, { canonical: '/', ogType: 'website', titleAbsolute: true });
 */
export function toMetadata(
  seo: TSeoResolved,
  opts: TToMetadataOptions,
): Metadata {
  const { canonical, ogType, titleAbsolute } = opts;
  // `ogImageUrl` can be absent (see `TSeoResolved`) — omit the image entirely
  // rather than emit an `og:image`/twitter image with no URL.
  const images = seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : [];

  return {
    title: titleAbsolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      images,
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: images.map((image) => image.url),
    },
  };
}
