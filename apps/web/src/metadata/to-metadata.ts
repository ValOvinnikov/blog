import {
  type TImageTenant,
  type TSeoResolved,
  urlForSanityImage,
} from '@blog/service';
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
 * Maps an authored `TSeoResolved` view-model to Next `Metadata`, passing
 * unauthored fields through as `undefined` so they are omitted rather than
 * inheriting a parent segment's value.
 *
 * @example
 * return toMetadata(result.data.seo, tenantContext, { canonical: '/', ogType: 'website', titleAbsolute: true });
 */
export const toMetadata = (
  seo: TSeoResolved,
  tenant: TImageTenant,
  opts: TToMetadataOptions,
): Metadata => {
  const { canonical, ogType, titleAbsolute, feedUrl, article } = opts;
  const ogImageUrl = seo.ogImage
    ? urlForSanityImage(seo.ogImage, tenant)
    : undefined;
  const ogImages = ogImageUrl ? [{ url: ogImageUrl }] : undefined;
  const twitterImages = ogImageUrl ? [ogImageUrl] : undefined;
  const twitterCard = ogImageUrl ? 'summary_large_image' : 'summary';

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
      card: twitterCard,
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: twitterImages,
    },
  };
};
