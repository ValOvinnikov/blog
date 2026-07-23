import type { ISanityImage, TMaybeUndefined } from '@blog/config';
import type { postCardFragment } from '@blog/service/shared/fragments/post';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferFragmentType } from 'groqd';

export type TRawPostCard = InferFragmentType<typeof postCardFragment>;

export type TPostCardAuthor = {
  id: string;
  name: string;
  slug: string;
  imageUrl: TMaybeUndefined<string>;
};

export type TPostCardCategory = {
  id: string;
  title: string;
  slug: string;
};

export type TPostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  heroImageUrl: TMaybeUndefined<string>;
  heroImageAlt: TMaybeUndefined<string>;
  heroImageSanity: TMaybeUndefined<ISanityImage>;
  featured: boolean;
  author: TPostCardAuthor;
  categories: TPostCardCategory[];
};

function toPostCardAuthor(raw: TRawPostCard['author']): TPostCardAuthor {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    imageUrl: buildImageUrl(raw.image),
  };
}

export function toPostCardCategory(
  raw: TRawPostCard['categories'][number],
): TPostCardCategory {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
  };
}

export function toPostCard(raw: TRawPostCard): TPostCard {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    publishedAt: raw.publishedAt,
    heroImageUrl: buildImageUrl(raw.heroImage),
    heroImageAlt: raw.heroImage?.alt,
    heroImageSanity: toSanityImage(raw.heroImageAsset),
    featured: raw.featured ?? false,
    author: toPostCardAuthor(raw.author),
    categories: raw.categories.map(toPostCardCategory),
  };
}
