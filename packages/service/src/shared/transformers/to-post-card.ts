import type { ISanityImage, TMaybeUndefined } from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import type { postCardFragment } from '@blog/service/shared/fragments/post';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { toPostHeading } from '@blog/service/shared/transformers/to-post-heading';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferFragmentType } from 'groqd';

export type TRawPostCard = InferFragmentType<typeof postCardFragment>;

export type TPostCardAuthor = {
  id: string;
  name: string;
  profilePageSlug: TMaybeUndefined<string>;
  imageUrl: TMaybeUndefined<string>;
};

export type TPostCardTopic = {
  id: string;
  title: string;
  slug: string;
};

export type TPostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: TMaybeUndefined<string>;
  publishedAt: string;
  heroImageUrl: TMaybeUndefined<string>;
  heroImageAlt: TMaybeUndefined<string>;
  heroImageSanity: TMaybeUndefined<ISanityImage>;
  featured: boolean;
  author: TMaybeUndefined<TPostCardAuthor>;
  topic: TMaybeUndefined<TPostCardTopic>;
  readingTimeMinutes: number;
};

function toPostCardAuthor(
  raw: NonNullable<TRawPostCard['author']>,
  tenant: TImageTenant,
): TPostCardAuthor {
  return {
    id: raw._id,
    name: raw.name,
    profilePageSlug: raw.profilePage?.slug ?? undefined,
    imageUrl: buildImageUrl(raw.image, tenant),
  };
}

export function toPostCardTopic(
  raw: NonNullable<TRawPostCard['topic']>,
): TPostCardTopic {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
  };
}

export function toPostCard(raw: TRawPostCard, tenant: TImageTenant): TPostCard {
  const { title, excerpt } = toPostHeading(raw.sectionHeader);

  return {
    id: raw._id,
    title,
    slug: raw.slug,
    excerpt,
    publishedAt: raw.publishedAt,
    heroImageUrl: buildImageUrl(raw.heroImage, tenant),
    heroImageAlt: raw.heroImage?.alt,
    heroImageSanity: toSanityImage(raw.heroImageAsset, tenant),
    featured: raw.featured ?? false,
    author: raw.author ? toPostCardAuthor(raw.author, tenant) : undefined,
    topic: raw.topic ? toPostCardTopic(raw.topic) : undefined,
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
