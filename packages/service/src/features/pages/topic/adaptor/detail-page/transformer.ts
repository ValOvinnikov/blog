import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import { toTopic } from '@blog/service/shared/transformers/topic/to-topic';
import type { InferResultType } from 'groqd';

import type { topicPageQuery } from './query';
import type { TTopicDetailPage } from './types';

export type TRawTopicPage = NonNullable<InferResultType<typeof topicPageQuery>>;

export function toTopicDetailPage(
  rawPage: TRawTopicPage,
  faqs: TFaqPageQuestion[],
): TTopicDetailPage {
  const topic = toTopic(rawPage.topic);

  return {
    topic,
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    faqs,
    seo: resolveSeo(rawPage.seo),
  };
}
