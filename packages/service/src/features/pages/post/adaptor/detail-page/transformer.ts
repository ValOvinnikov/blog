import { PORTABLE_TEXT_BLOCK_TYPE, type TMaybeUndefined } from '@blog/config';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toModule } from '@blog/service/shared/transformers/module/to-module';
import { toPersonProfile } from '@blog/service/shared/transformers/person/to-person-profile';
import { toPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import { toTag } from '@blog/service/shared/transformers/tag/to-tag';
import { toTopic } from '@blog/service/shared/transformers/topic/to-topic';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { postPageQuery } from './query';
import type { TPostDetail, TPostDetailAuthor, TPostTakeaways } from './types';

export type TRawPostDetail = NonNullable<InferResultType<typeof postPageQuery>>;

function toPostDetailAuthor(raw: TRawPostDetail['author']): TPostDetailAuthor {
  const person = toPersonProfile(raw);

  return {
    id: person.id,
    name: person.name,
    profilePageHref: person.profileUrl,
    image: person.image,
    role: person.role,
    bio: person.bio,
    socialLinks: person.socialLinks,
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
  const { heading: title, supportingText: excerpt } = toHeadingBlock(
    raw.headingBlock,
  );

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
    hasAsides: raw.body.some(
      (block) => block._type === PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
    ),
    seo: resolveSeo(raw.seo),
    author: toPostDetailAuthor(raw.author),
    topic: toTopic(raw.topic),
    tags: (raw.tags ?? []).map(toTag),
    modules: (raw.modules ?? []).map(toModule),
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
