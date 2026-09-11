import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { landingPageQuery } from './query';
import type { TLandingPage } from './types';

export type TRawLandingPage = NonNullable<
  InferResultType<typeof landingPageQuery>
>;

export function toLandingPage(raw: TRawLandingPage): TLandingPage {
  return {
    slug: raw.slug,
    headingBlock: toHeadingBlock(raw.headingBlock),
    hero: toHeroSlot(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    seo: resolveSeo(raw.seo),
  };
}
