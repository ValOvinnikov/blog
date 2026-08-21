import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toModule } from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { blogPageQuery } from './query';
import type { TBlogIndexPage } from './types';

export type TRawBlogPage = InferResultType<typeof blogPageQuery>;

export function toIndexPage(
  rawPage: TRawBlogPage,
  settings: TSiteSettings,
  postListId: string,
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
    ),
    postListId,
  };
}
