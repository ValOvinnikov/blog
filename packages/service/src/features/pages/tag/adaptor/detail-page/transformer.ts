import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
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

function toTagDetailPageTag(raw: TRawTagDetailPageTag): TTagDetailPageTag {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description ?? undefined,
  };
}

export function toTagDetailPage(
  rawPage: TRawTagPage,
  settings: TSiteSettings,
  tenant: TImageTenant,
): TTagDetailPage {
  const tag = toTagDetailPageTag(rawPage.tag);
  const headingBlock = toHeadingBlock(rawPage.headingBlock);

  return {
    tag,
    headingBlock: {
      heading: headingBlock.heading ?? tag.title,
      supportingText: headingBlock.supportingText ?? tag.description,
    },
    hero: rawPage.hero ? toHeroSlot(rawPage.hero) : undefined,
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: tag.title, description: tag.description },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
      tenant,
    ),
  };
}
