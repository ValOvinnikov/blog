import { type TSeoResolved, urlForSanityImage } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

export type TToMetadataOptions = {
  canonical: string;
  ogType: 'website' | 'article';
  titleAbsolute?: boolean;
  feedUrl?: string;
  article?: {
    publishedTime?: string;
    authors?: string[];
  };
};

/**
 * Unauthored fields pass through as `undefined` so they are omitted rather
 * than inheriting a parent segment's value.
 */
export const toMetadata = async (
  seo: TSeoResolved,
  opts: TToMetadataOptions,
): Promise<Metadata> => {
  const { canonical, ogType, titleAbsolute, feedUrl, article } = opts;
  const { sanityContext } = await getRequestContext();
  const ogImageUrl = seo.ogImage
    ? urlForSanityImage(seo.ogImage, sanityContext)
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
