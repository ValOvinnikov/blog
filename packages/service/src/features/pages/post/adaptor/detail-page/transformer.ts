import type { TMaybeUndefined } from '@blog/config';
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

function toPostDetailAuthor(raw: TRawPostDetail['author']): TPostDetailAuthor {
  return {
    id: raw._id,
    name: raw.name,
    profilePageSlug: raw.profilePage?.slug ?? undefined,
    image: toSanityImage(raw.image),
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

export function toPostDetail(raw: TRawPostDetail): TPostDetail {
  const { title, excerpt } = toPostHeading(raw.headingBlock);

  return {
    id: raw._id,
    title,
    slug: raw.slug,
    excerpt,
    publishedAt: raw.publishedAt,
    heroImage: toSanityImage(raw.heroImage),
    featured: raw.featured ?? false,
    body: toPortableTextBody(raw.body),
    skim: toPostSkim(raw.skim),
    hasAsides: raw.body.some((block) => block._type === 'aside'),
    seo: resolveSeo(raw.seo),
    author: toPostDetailAuthor(raw.author),
    topic: toTopic(raw.topic),
    tags: (raw.tags ?? []).map(toTag),
    modules: (raw.modules ?? []).map(toModule),
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
