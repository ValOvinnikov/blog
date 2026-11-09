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

import type { sectionIndexPageQuery } from './query';
import type { TSectionIndexPageDocument } from './types';

export type TRawSectionIndexPage = NonNullable<
  InferResultType<ReturnType<typeof sectionIndexPageQuery>>
>;

export function toSectionIndexPage(
  raw: TRawSectionIndexPage,
  defaultLocale: TLocaleIsoCode,
): TSectionIndexPageDocument {
  const {
    _id,
    headingBlock,
    contentAlignment,
    hero,
    modules,
    seo,
    translations,
  } = raw;

  return {
    id: _id,
    headingBlock: toHeadingBlock(headingBlock),
    headingAlignment: toHeadingAlignment(contentAlignment),
    hero: toHeroSlot(hero),
    modules: (modules ?? []).map(toModule),
    seo: resolveSeo(seo),
    translations: toPageLanguages(translations, defaultLocale),
  };
}
