import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { blogPageQuery } from './query';
import type { TBlogIndexPage } from './types';

export type TRawBlogPage = NonNullable<InferResultType<typeof blogPageQuery>>;

export function toIndexPage(rawPage: TRawBlogPage): TBlogIndexPage {
  return {
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
  };
}
