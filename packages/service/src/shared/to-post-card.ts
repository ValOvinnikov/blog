import type { InferFragmentType } from 'groqd';
import type { ImageWithAlt } from '@blog/types';
import { urlForImage } from '#/sanity/image';
import { postCardFragment } from '#/shared/fragments/post';
import type {
  TPostCard,
  TPostCardAuthor,
  TPostCardCategory,
} from './types';

/** Raw type that any post-card query projects */
export type TRawPostCard = InferFragmentType<typeof postCardFragment>;

export function buildImageUrl(image: ImageWithAlt | null | undefined): string | null {
  if (!image?.asset) return null;
  try {
    return urlForImage(image);
  } catch {
    return null;
  }
}

function toPostCardAuthor(
  raw: NonNullable<TRawPostCard['author']>,
): TPostCardAuthor {
  return {
    id: raw._id,
    name: raw.name ?? '',
    slug: raw.slug?.current ?? '',
    imageUrl: buildImageUrl(raw.image as ImageWithAlt | null | undefined),
  };
}

function toPostCardCategory(
  raw: NonNullable<TRawPostCard['categories']>[number],
): TPostCardCategory {
  return {
    id: raw._id,
    title: raw.title ?? '',
    slug: raw.slug?.current ?? '',
  };
}

export function toPostCard(raw: TRawPostCard): TPostCard {
  return {
    id: raw._id,
    title: raw.title ?? '',
    slug: raw.slug?.current ?? '',
    excerpt: raw.excerpt ?? null,
    publishedAt: raw.publishedAt ?? null,
    mainImageUrl: buildImageUrl(raw.mainImage as ImageWithAlt | null | undefined),
    mainImageAlt: (raw.mainImage as ImageWithAlt | null | undefined)?.alt ?? '',
    featured: raw.featured ?? false,
    author: raw.author ? toPostCardAuthor(raw.author) : null,
    categories: (raw.categories ?? []).map(toPostCardCategory),
  };
}
