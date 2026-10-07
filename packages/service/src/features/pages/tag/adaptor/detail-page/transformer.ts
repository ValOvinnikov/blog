import { toPageTranslations } from '@blog/service/shared/localization/page-translations/to-page-translations';
import { toHeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { tagPageQuery } from './query';
import type { TTagDetailPageDocument, TTagDetailPageTag } from './types';

export type TRawTagPage = NonNullable<InferResultType<typeof tagPageQuery>>;
type TRawTagDetailPageTag = TRawTagPage['tag'];

function toTagDetailPageTag(rawTag: TRawTagDetailPageTag): TTagDetailPageTag {
  return {
    id: rawTag._id,
    title: rawTag.title,
    slug: rawTag.slug ?? undefined,
    description: rawTag.description ?? undefined,
  };
}

export function toTagDetailPage(rawPage: TRawTagPage): TTagDetailPageDocument {
  const tag = toTagDetailPageTag(rawPage.tag);

  return {
    tag,
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    headingAlignment: toHeadingAlignment(rawPage.contentAlignment),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
    translations: toPageTranslations(rawPage.translations),
  };
}
