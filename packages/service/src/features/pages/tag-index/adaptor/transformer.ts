import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import type { InferResultType } from 'groqd';

import type { tagIndexPageQuery } from './query';
import type { TTagIndexPage } from './types';

export type TRawTagIndexPage = NonNullable<
  InferResultType<typeof tagIndexPageQuery>
>;

export function toTagIndexPage(
  rawPage: TRawTagIndexPage,
  settings: TSiteSettings,
  taxonomyListId: string,
  tenant: TImageTenant,
): TTagIndexPage {
  return {
    heading: rawPage.heading,
    supportingText: rawPage.supportingText ?? undefined,
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: rawPage.heading },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
      tenant,
    ),
    taxonomyListId,
  };
}
