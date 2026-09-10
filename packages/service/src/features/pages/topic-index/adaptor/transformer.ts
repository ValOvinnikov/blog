import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { topicIndexPageQuery } from './query';
import type { TTopicIndexPage } from './types';

export type TRawTopicIndexPage = NonNullable<
  InferResultType<typeof topicIndexPageQuery>
>;

export function toTopicIndexPage(
  rawPage: TRawTopicIndexPage,
  tenant: TImageTenant,
): TTopicIndexPage {
  return {
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo ?? undefined, tenant),
  };
}
