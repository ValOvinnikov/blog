import { toPageTranslations } from '@shinefold/service/shared/localization/page-translations/to-page-translations';
import { toHeadingAlignment } from '@shinefold/service/shared/transformers/heading-block/to-heading-alignment';
import { toHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@shinefold/service/shared/transformers/module/to-module';
import { resolveSeo } from '@shinefold/service/shared/transformers/seo/resolve-seo';
import { toTopic } from '@shinefold/service/shared/transformers/topic/to-topic';
import type { InferResultType } from 'groqd';

import type { topicPageQuery } from './query';
import type { TTopicDetailPageDocument } from './types';

export type TRawTopicPage = NonNullable<InferResultType<typeof topicPageQuery>>;

export function toTopicDetailPage(
  rawPage: TRawTopicPage,
): TTopicDetailPageDocument {
  const topic = toTopic(rawPage.topic);

  return {
    topic,
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    headingAlignment: toHeadingAlignment(rawPage.contentAlignment),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
    translations: toPageTranslations(rawPage.translations),
  };
}
