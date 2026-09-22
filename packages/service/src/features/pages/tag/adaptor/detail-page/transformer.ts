import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { tagPageQuery } from './query';
import type { TTagDetailPage, TTagDetailPageTag } from './types';

export type TRawTagPage = NonNullable<InferResultType<typeof tagPageQuery>>;
type TRawTagDetailPageTag = TRawTagPage['tag'];

function toTagDetailPageTag(rawTag: TRawTagDetailPageTag): TTagDetailPageTag {
  return {
    id: rawTag._id,
    title: rawTag.title,
    slug: rawTag.slug,
    description: rawTag.description ?? undefined,
  };
}

export function toTagDetailPage(rawPage: TRawTagPage): TTagDetailPage {
  const tag = toTagDetailPageTag(rawPage.tag);

  return {
    tag,
    headingBlock: toHeadingBlock(rawPage.headingBlock),
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
  };
}
