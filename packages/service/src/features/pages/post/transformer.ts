import type { InferResultType } from 'groqd';
import type { ImageWithAlt } from '@blog/types';
import { buildImageUrl } from '#/shared/to-post-card';
import type {
  TPostDetail,
  TPostDetailAuthor,
  TCategory,
  TSeoMeta,
  TSocialLink,
} from '#/shared/types';
import { postDetailQuery } from './query';

type TRawPostDetail = NonNullable<InferResultType<typeof postDetailQuery>>;

function toCategory(
  raw: NonNullable<TRawPostDetail['categories']>[number],
): TCategory {
  return {
    id: raw._id,
    title: raw.title ?? '',
    slug: raw.slug ?? '',
    description: raw.description ?? null,
  };
}

function toSocialLink(raw: {
  platform?: string;
  url?: string;
}): TSocialLink {
  return {
    platform: raw.platform ?? '',
    url: raw.url ?? '',
  };
}

function toPostDetailAuthor(
  raw: NonNullable<TRawPostDetail['author']>,
): TPostDetailAuthor {
  const rawImage = raw.image as ImageWithAlt | null | undefined;
  return {
    id: raw._id,
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    imageUrl: buildImageUrl(rawImage),
    role: raw.role ?? null,
    bio: raw.bio ?? null,
    socialLinks: (raw.socialLinks ?? []).map(toSocialLink),
  };
}

function toSeoMeta(
  raw: NonNullable<TRawPostDetail['seo']>,
): TSeoMeta {
  return {
    metaTitle: raw.metaTitle ?? null,
    metaDescription: raw.metaDescription ?? null,
    ogImageUrl: raw.ogImage ? buildImageUrl(raw.ogImage as ImageWithAlt) : null,
  };
}

export type { TPostDetail };

export function toPostDetail(raw: TRawPostDetail): TPostDetail {
  return {
    id: raw._id,
    title: raw.title ?? '',
    slug: raw.slug ?? '',
    excerpt: raw.excerpt ?? null,
    publishedAt: raw.publishedAt ?? null,
    mainImageUrl: buildImageUrl(raw.mainImage),
    mainImageAlt: raw.mainImage?.alt ?? '',
    featured: raw.featured ?? false,
    body: raw.body ?? null,
    seo: raw.seo ? toSeoMeta(raw.seo) : null,
    author: raw.author ? toPostDetailAuthor(raw.author) : null,
    categories: (raw.categories ?? []).map(toCategory),
  };
}
