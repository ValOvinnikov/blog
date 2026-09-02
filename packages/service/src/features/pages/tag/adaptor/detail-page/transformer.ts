import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toModule } from '@blog/service/shared/transformers/to-module';
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
  postListId: string,
  tenant: TImageTenant,
): TTagDetailPage {
  const tag = toTagDetailPageTag(rawPage.tag);

  return {
    tag,
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
    postListId,
  };
}
