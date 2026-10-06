import type { TLocaleIsoCode } from '@blog/config/constants';
import { toPageLanguages } from '@blog/service/shared/localization/page-languages/to-page-languages';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { homePageQuery } from './query';
import type { THomePage } from './types';

export type TRawHomePage = NonNullable<InferResultType<typeof homePageQuery>>;

export function toHomePage(
  raw: TRawHomePage,
  defaultLocale: TLocaleIsoCode,
  faqs: TFaqPageQuestion[],
): THomePage {
  return {
    headingBlock: toHeadingBlock(raw.headingBlock),
    hero: toHeroSlot(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    faqs,
    seo: resolveSeo(raw.seo),
    translations: toPageLanguages(raw.translations, defaultLocale),
  };
}
