import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { blogPageQuery } from './query';
import type { TBlogIndexPage } from './types';

export type TRawBlogPage = NonNullable<InferResultType<typeof blogPageQuery>>;

export function toIndexPage(
  rawPage: TRawBlogPage,
  settings: TSiteSettings,
  tenant: TImageTenant,
): TBlogIndexPage {
  return {
    title: rawPage.title,
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    hero: rawPage.hero ? toHeroSlot(rawPage.hero) : undefined,
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: rawPage.title },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
      tenant,
    ),
  };
}
