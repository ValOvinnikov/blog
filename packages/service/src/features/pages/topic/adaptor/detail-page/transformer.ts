import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
import { toTopic } from '@blog/service/shared/transformers/to-topic';
import type { InferResultType } from 'groqd';

import type { topicPageQuery } from './query';
import type { TTopicDetailPage } from './types';

export type TRawTopicPage = NonNullable<InferResultType<typeof topicPageQuery>>;

export function toTopicDetailPage(
  rawPage: TRawTopicPage,
  settings: TSiteSettings,
  tenant: TImageTenant,
): TTopicDetailPage {
  const topic = toTopic(rawPage.topic);
  const headingBlock = toHeadingBlock(rawPage.headingBlock);

  return {
    topic,
    headingBlock: {
      heading: headingBlock.heading ?? topic.title,
      supportingText: headingBlock.supportingText ?? topic.description,
    },
    hero: rawPage.hero ? toHeroSlot(rawPage.hero) : undefined,
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: topic.title, description: topic.description },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
      tenant,
    ),
  };
}
