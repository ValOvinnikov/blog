import type { TMaybeUndefined } from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toModule } from '@blog/service/shared/transformers/to-module';
import { toPortableTextBody } from '@blog/service/shared/transformers/to-portable-text-body';
import { toPostHeading } from '@blog/service/shared/transformers/to-post-heading';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toSocialLink } from '@blog/service/shared/transformers/to-social-link';
import { toTag } from '@blog/service/shared/transformers/to-tag';
import { toTopic } from '@blog/service/shared/transformers/to-topic';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { postPageQuery } from './query';
import type { TPostDetail, TPostDetailAuthor, TPostSkim } from './types';

export type TRawPostDetail = NonNullable<InferResultType<typeof postPageQuery>>;

// PostMeta renders the author avatar at SIZE.SM (32px, `avatar-variants.ts`)
// — 64px covers a 2x DPR display without serving the source asset's full
// natural resolution.
const AUTHOR_AVATAR_SIZE_PX = 64;

function toPostDetailAuthor(
  raw: TRawPostDetail['author'],
  tenant: TImageTenant,
): TPostDetailAuthor {
  return {
    id: raw._id,
    name: raw.name,
    profilePageSlug: raw.profilePage?.slug ?? undefined,
    imageUrl: buildImageUrl(raw.image, tenant, {
      width: AUTHOR_AVATAR_SIZE_PX,
      height: AUTHOR_AVATAR_SIZE_PX,
      fit: 'crop',
      quality: 75,
    }),
    role: raw.role ?? undefined,
    bio: raw.bio ?? undefined,
    socialLinks: (raw.socialLinks ?? []).map(toSocialLink),
  };
}

// Mirrors the schema's own `min(3)` takeaways rule (`skim.ts`) — fewer than
// 3 takeaways is treated the same as no `skim` at all, never a partial list.
function toPostSkim(raw: TRawPostDetail['skim']): TMaybeUndefined<TPostSkim> {
  if (!raw?.takeaways || raw.takeaways.length < 3) return undefined;

  return {
    takeaways: raw.takeaways,
    generatedAt: raw.generatedAt ?? undefined,
    model: raw.model ?? undefined,
  };
}

export function toPostDetail(
  raw: TRawPostDetail,
  tenant: TImageTenant,
): TPostDetail {
  const heroImageUrl = buildImageUrl(raw.heroImage, tenant);
  const { title, excerpt } = toPostHeading(raw.headingBlock);

  return {
    id: raw._id,
    title,
    slug: raw.slug,
    excerpt,
    publishedAt: raw.publishedAt,
    heroImageUrl,
    heroImageAlt: raw.heroImage?.alt,
    heroImageSanity: toSanityImage(raw.heroImageAsset, tenant),
    featured: raw.featured ?? false,
    body: toPortableTextBody(raw.body, tenant),
    skim: toPostSkim(raw.skim),
    hasAsides: raw.body.some((block) => block._type === 'aside'),
    seo: resolveSeo(raw.seo, tenant),
    author: toPostDetailAuthor(raw.author, tenant),
    topic: toTopic(raw.topic),
    tags: (raw.tags ?? []).map(toTag),
    modules: (raw.modules ?? []).map(toModule),
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
