import { toModule } from '@blog/service/shared/transformers/to-module';
import { toSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';
import type { InferResultType } from 'groqd';

import type { homePageQuery } from './query';
import type { THomePage } from './types';

export type TRawHomePage = InferResultType<typeof homePageQuery>;

export function toHomePage(raw: TRawHomePage): THomePage {
  return {
    title: raw.title,
    hero: toModule(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    seo: raw.seo ? toSeoMeta(raw.seo) : undefined,
  };
}
