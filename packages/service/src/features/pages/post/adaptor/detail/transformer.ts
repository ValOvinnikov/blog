import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { toCategory } from '@blog/service/shared/transformers/to-category';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toSocialLink } from '@blog/service/shared/transformers/to-social-link';
import type { InferResultType } from 'groqd';

import type { postDetailQuery } from './query';
import type { TPostDetail, TPostDetailAuthor, TPostSeo } from './types';

export type TRawPostDetail = NonNullable<
  InferResultType<typeof postDetailQuery>
>;

// TODO: replace with resolveSeo (content title/excerpt/heroImage ladder) once
// the /blog/{slug} route lands (#355 follow-up).
function toPostSeo(raw: NonNullable<TRawPostDetail['seo']>): TPostSeo {
  return {
    metaTitle: raw.metaTitle ?? undefined,
    metaDescription: raw.metaDescription ?? undefined,
    ogTitle: raw.openGraph?.ogTitle ?? undefined,
    ogDescription: raw.openGraph?.ogDescription ?? undefined,
    ogImageUrl: buildImageUrl(raw.openGraph?.ogImage),
  };
}

function toPostDetailAuthor(
  raw: NonNullable<TRawPostDetail['author']>,
): TPostDetailAuthor {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    imageUrl: buildImageUrl(raw.image),
    role: raw.role ?? undefined,
    bio: raw.bio ?? undefined,
    socialLinks: (raw.socialLinks ?? []).map(toSocialLink),
  };
}

export function toPostDetail(raw: TRawPostDetail): TPostDetail {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    publishedAt: raw.publishedAt,
    mainImageUrl: buildImageUrl(raw.mainImage),
    mainImageAlt: raw.mainImage.alt,
    mainImageSanity: toSanityImage(raw.mainImageAsset),
    featured: raw.featured ?? false,
    body: raw.body,
    seo: raw.seo ? toPostSeo(raw.seo) : undefined,
    author: raw.author ? toPostDetailAuthor(raw.author) : undefined,
    categories: raw.categories.map(toCategory),
  };
}
