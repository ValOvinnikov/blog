import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { toPageLanguages } from '@shinefold/service/shared/localization/page-languages/to-page-languages';
import { toHeadingAlignment } from '@shinefold/service/shared/transformers/heading-block/to-heading-alignment';
import { toHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@shinefold/service/shared/transformers/module/to-module';
import { resolveSeo } from '@shinefold/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { blogPageQuery } from './query';
import type { TBlogIndexPage } from './types';

export type TRawBlogPage = NonNullable<InferResultType<typeof blogPageQuery>>;

export function toIndexPage(
  rawPage: TRawBlogPage,
  defaultLocale: TLocaleIsoCode,
): TBlogIndexPage {
  return {
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    headingAlignment: toHeadingAlignment(rawPage.contentAlignment),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
    translations: toPageLanguages(rawPage.translations, defaultLocale),
  };
}
