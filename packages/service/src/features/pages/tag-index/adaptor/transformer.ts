import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toContentTitle } from '@blog/service/shared/transformers/to-content-title';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { tagIndexPageQuery } from './query';
import type { TTagIndexPage } from './types';

export type TRawTagIndexPage = NonNullable<
  InferResultType<typeof tagIndexPageQuery>
>;

export function toTagIndexPage(
  rawPage: TRawTagIndexPage,
  settings: TSiteSettings,
  tenant: TImageTenant,
): TTagIndexPage {
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
