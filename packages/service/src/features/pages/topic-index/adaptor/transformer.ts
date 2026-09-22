import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { topicIndexPageQuery } from './query';
import type { TTopicIndexPage } from './types';

export type TRawTopicIndexPage = NonNullable<
  InferResultType<typeof topicIndexPageQuery>
>;

export function toTopicIndexPage(rawPage: TRawTopicIndexPage): TTopicIndexPage {
  return {
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
  };
}
