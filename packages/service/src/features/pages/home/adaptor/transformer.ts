import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toModule } from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { homePageQuery } from './query';
import type { THomePage } from './types';

export type TRawHomePage = InferResultType<typeof homePageQuery>;

export function toHomePage(
  raw: TRawHomePage,
  settings: TSiteSettings,
): THomePage {
  return {
    title: raw.title,
    hero: toModule(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    seo: resolveSeo(
      raw.seo ?? undefined,
      { title: settings.brand.name },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
    ),
  };
}
