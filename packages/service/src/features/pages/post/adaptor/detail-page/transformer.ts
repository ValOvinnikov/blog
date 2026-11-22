import type { TMaybeUndefined } from '@shinefold/config';
import { toPageTranslations } from '@shinefold/service/shared/localization/page-translations/to-page-translations';
import { toHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@shinefold/service/shared/transformers/image/to-sanity-image';
import { toModule } from '@shinefold/service/shared/transformers/module/to-module';
import { toPersonProfile } from '@shinefold/service/shared/transformers/person/to-person-profile';
import { toPortableTextBody } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-body';
import { toPortableText } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-mark-def';
import { resolveSeo } from '@shinefold/service/shared/transformers/seo/resolve-seo';
import { toTag } from '@shinefold/service/shared/transformers/tag/to-tag';
import { toTopic } from '@shinefold/service/shared/transformers/topic/to-topic';
import { toReadingTimeMinutes } from '@shinefold/utils';
import { hasBlockText } from '@shinefold/utils/portable-text';
import type { InferResultType } from 'groqd';

import type { postPageQuery } from './query';
import type { TPostDetail, TPostTakeaways } from './types';

export type TRawPostDetail = NonNullable<InferResultType<typeof postPageQuery>>;

function toPostTakeaways(
  raw: TRawPostDetail['postTakeaways'],
): TMaybeUndefined<TPostTakeaways> {
  const summary = raw?.summary ?? [];
  if (!raw || !hasBlockText(summary)) return undefined;

  return {
    summary: summary.map(toPortableText),
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
    seo: resolveSeo(raw.seo),
    author: toPersonProfile(raw.author),
    topic: toTopic(raw.topic),
    tags: (raw.tags ?? []).map(toTag),
    modules: (raw.modules ?? []).map(toModule),
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
    translations: toPageTranslations(raw.translations),
  };
}
