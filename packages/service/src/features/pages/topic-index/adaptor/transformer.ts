import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import type { InferResultType } from 'groqd';

import type { topicIndexPageQuery } from './query';
import type { TTopicIndexPage } from './types';

export type TRawTopicIndexPage = NonNullable<
  InferResultType<typeof topicIndexPageQuery>
>;

export function toTopicIndexPage(
  rawPage: TRawTopicIndexPage,
  settings: TSiteSettings,
  taxonomyListId: string,
): TTopicIndexPage {
  return {
    heading: rawPage.heading,
    supportingText: rawPage.supportingText ?? undefined,
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: rawPage.heading },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
    ),
    taxonomyListId,
  };
}
