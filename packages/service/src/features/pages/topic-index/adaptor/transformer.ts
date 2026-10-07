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

import type { topicIndexPageQuery } from './query';
import type { TTopicIndexPage } from './types';

export type TRawTopicIndexPage = NonNullable<
  InferResultType<typeof topicIndexPageQuery>
>;

export function toTopicIndexPage(
  rawPage: TRawTopicIndexPage,
  defaultLocale: TLocaleIsoCode,
): TTopicIndexPage {
  return {
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    headingAlignment: toHeadingAlignment(rawPage.contentAlignment),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
    translations: toPageLanguages(rawPage.translations, defaultLocale),
  };
}
