import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
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

export function toTagIndexPage(rawPage: TRawTagIndexPage): TTagIndexPage {
  return {
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
  };
}
