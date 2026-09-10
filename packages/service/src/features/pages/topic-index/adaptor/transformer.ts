import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
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

/** The SEO content title: the authored heading, or the brand name when it's unset or blank. */
function toContentTitle(
  heading: string | undefined,
  brandName: string,
): string {
  return heading?.trim() ? heading : brandName;
}

export function toTopicIndexPage(
  rawPage: TRawTopicIndexPage,
  settings: TSiteSettings,
  tenant: TImageTenant,
): TTopicIndexPage {
  const headingBlock = toHeadingBlock(rawPage.headingBlock);

  return {
    headingBlock,
    hero: rawPage.hero ? toHeroSlot(rawPage.hero) : undefined,
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: toContentTitle(headingBlock.heading, settings.brand.name) },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
      tenant,
    ),
  };
}
