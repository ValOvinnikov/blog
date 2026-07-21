import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toCategory } from '@blog/service/shared/transformers/to-category';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toSocialLink } from '@blog/service/shared/transformers/to-social-link';
import type { InferResultType } from 'groqd';

import type { postDetailQuery } from './query';
import type { TPostDetail, TPostDetailAuthor } from './types';

export type TRawPostDetail = NonNullable<
  InferResultType<typeof postDetailQuery>
>;

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

export function toPostDetail(
  raw: TRawPostDetail,
  settings: TSiteSettings,
): TPostDetail {
  const heroImageUrl = buildImageUrl(raw.heroImage);

  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    publishedAt: raw.publishedAt,
    heroImageUrl,
    heroImageAlt: raw.heroImage?.alt,
    heroImageSanity: toSanityImage(raw.heroImageAsset),
    featured: raw.featured ?? false,
    body: raw.body,
    seo: resolveSeo(
      raw.seo ?? undefined,
      { title: raw.title, description: raw.excerpt, imageUrl: heroImageUrl },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
    ),
    author: raw.author ? toPostDetailAuthor(raw.author) : undefined,
    categories: raw.categories.map(toCategory),
  };
}
