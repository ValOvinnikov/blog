import type { InferFragmentType } from 'groqd';

import type { postCardFragment } from '#/shared/fragments/post';
import { buildImageUrl } from '#/shared/transformers/build-image-url';

export type TRawPostCard = InferFragmentType<typeof postCardFragment>;

export type TPostCardAuthor = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | undefined;
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
  mainImageUrl: string | undefined;
  mainImageAlt: string;
  featured: boolean;
  author: TPostCardAuthor | undefined;
  categories: TPostCardCategory[];
};

function toPostCardAuthor(
  raw: NonNullable<TRawPostCard['author']>
): TPostCardAuthor {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    imageUrl: buildImageUrl(raw.image),
  };
}

function toPostCardCategory(
  raw: NonNullable<TRawPostCard['categories']>[number]
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
    mainImageUrl: buildImageUrl(raw.mainImage),
    mainImageAlt: raw.mainImage.alt,
    featured: raw.featured ?? false,
    author: raw.author ? toPostCardAuthor(raw.author) : undefined,
    categories: (raw.categories ?? []).map(toPostCardCategory),
  };
}
