import { resolveFaqs } from '@blog/service/shared/transformers/faq/resolve-faqs';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
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
    faqs: resolveFaqs(raw.faqs),
    seo: resolveSeo(raw.seo),
  };
}
