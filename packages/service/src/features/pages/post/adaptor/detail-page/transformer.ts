import type { TMaybeUndefined } from '@blog/config';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toLinkDocument } from '@blog/service/shared/transformers/to-link-document';
import { toModule } from '@blog/service/shared/transformers/to-module';
import { toPortableTextBody } from '@blog/service/shared/transformers/to-portable-text-body';
import { toPortableTextBlockWithResolvedLinks } from '@blog/service/shared/transformers/to-portable-text-mark-def';
import { toPostHeading } from '@blog/service/shared/transformers/to-post-heading';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toSocialProfiles } from '@blog/service/shared/transformers/to-social-profiles';
import { toTag } from '@blog/service/shared/transformers/to-tag';
import { toTopic } from '@blog/service/shared/transformers/to-topic';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { postPageQuery } from './query';
import type { TPostDetail, TPostDetailAuthor, TPostTakeaways } from './types';

export type TRawPostDetail = NonNullable<InferResultType<typeof postPageQuery>>;

function toPostDetailAuthor(raw: TRawPostDetail['author']): TPostDetailAuthor {
  return {
    id: raw._id,
    name: raw.name,
    profilePageHref: toLinkDocument(raw.profilePage)?.href,
    image: toSanityImage(raw.image),
    role: raw.role ?? undefined,
    bio: raw.bio?.map(toPortableTextBlockWithResolvedLinks) ?? undefined,
    socialLinks: toSocialProfiles(raw.socialLinks),
  };
}

// Mirrors the schema's own `min(3)` takeaways rule — fewer than 3 takeaways
// is treated the same as none at all, never a partial list.
function toPostTakeaways(
  raw: TRawPostDetail['postTakeaways'],
): TMaybeUndefined<TPostTakeaways> {
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
    postTakeaways: toPostTakeaways(raw.postTakeaways),
    hasAsides: raw.body.some((block) => block._type === 'aside'),
    seo: resolveSeo(raw.seo),
    author: toPostDetailAuthor(raw.author),
    topic: toTopic(raw.topic),
    tags: (raw.tags ?? []).map(toTag),
    modules: (raw.modules ?? []).map(toModule),
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
