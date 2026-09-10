import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { homePageQuery } from './query';
import type { THomePage } from './types';

export type TRawHomePage = NonNullable<InferResultType<typeof homePageQuery>>;

export function toHomePage(raw: TRawHomePage, tenant: TImageTenant): THomePage {
  return {
    headingBlock: toHeadingBlock(raw.headingBlock),
    hero: toHeroSlot(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    seo: resolveSeo(raw.seo, tenant),
  };
}
