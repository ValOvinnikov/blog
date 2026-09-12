import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
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
  const headingBlock = toHeadingBlock(rawPage.headingBlock);

  return {
    tag,
    headingBlock: {
      heading: headingBlock.heading,
      supportingText: headingBlock.supportingText ?? tag.description,
    },
    hero: toHeroSlot(rawPage.hero),
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(rawPage.seo),
  };
}
