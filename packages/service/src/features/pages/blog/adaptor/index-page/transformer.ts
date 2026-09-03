import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toModule } from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { blogPageQuery } from './query';
import type { TBlogIndexPage } from './types';

export type TRawBlogPage = NonNullable<InferResultType<typeof blogPageQuery>>;

export function toIndexPage(
  rawPage: TRawBlogPage,
  settings: TSiteSettings,
  postListId: string,
  tenant: TImageTenant,
): TBlogIndexPage {
  return {
    heading: rawPage.heading,
    supportingText: rawPage.supportingText ?? undefined,
    modules: (rawPage.modules ?? []).map(toModule),
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: rawPage.heading },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
      tenant,
    ),
    postListId,
  };
}
