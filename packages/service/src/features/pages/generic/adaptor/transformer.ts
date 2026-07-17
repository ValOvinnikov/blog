import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toModule } from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { genericPageQuery } from './query';
import type { TGenericPage } from './types';

export type TRawGenericPage = InferResultType<typeof genericPageQuery>;

export function toGenericPage(
  raw: TRawGenericPage,
  settings: TSiteSettings,
): TGenericPage {
  return {
    title: raw.title,
    slug: raw.slug,
    modules: (raw.modules ?? []).map(toModule),
    // The page_generic schema has no excerpt/summary or image field, so the
    // content-derived tier only supplies a title; description/image fall
    // through to the site defaults.
    seo: resolveSeo(
      raw.seo ?? undefined,
      { title: raw.title },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
    ),
  };
}
