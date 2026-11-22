import type { TValueOf } from '@shinefold/config/utils';
import { type TSeoResolved, urlForSanityImage } from '@shinefold/service';
import { ALTERNATE_TYPE, OG_TYPE, TWITTER_CARD } from '@web/constants/metadata';
import { getRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

export type TToMetadataOptions = {
  canonical: string;
  ogType: TValueOf<typeof OG_TYPE>;
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
  const { title, description, ogTitle, ogDescription, ogImage } = seo;
  const { sanityContext } = await getRequestContext();
  const ogImageUrl = ogImage
    ? urlForSanityImage(ogImage, sanityContext)
    : undefined;
  const ogImages = ogImageUrl ? [{ url: ogImageUrl }] : undefined;
  const twitterImages = ogImageUrl ? [ogImageUrl] : undefined;
  const twitterCard = ogImageUrl
    ? TWITTER_CARD.SUMMARY_LARGE_IMAGE
    : TWITTER_CARD.SUMMARY;

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      ...(feedUrl && { types: { [ALTERNATE_TYPE.RSS]: feedUrl } }),
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImages,
      type: ogType,
      ...(article?.publishedTime && { publishedTime: article.publishedTime }),
      ...(article?.authors && { authors: article.authors }),
    },
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogDescription,
      images: twitterImages,
    },
  };
};
