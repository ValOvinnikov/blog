import type { TLocaleIsoCode } from '@blog/config/constants';
import { toPageLanguages } from '@blog/service/shared/localization/page-languages/to-page-languages';
import { toHeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { homePageQuery } from './query';
import type { THomePageDocument } from './types';

export type TRawHomePage = NonNullable<InferResultType<typeof homePageQuery>>;

export function toHomePage(
  raw: TRawHomePage,
  defaultLocale: TLocaleIsoCode,
): THomePageDocument {
  return {
    headingBlock: toHeadingBlock(raw.headingBlock),
    headingAlignment: toHeadingAlignment(raw.contentAlignment),
    hero: toHeroSlot(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    seo: resolveSeo(raw.seo),
    translations: toPageLanguages(raw.translations, defaultLocale),
  };
}
