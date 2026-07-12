import { toModuleRef } from '@blog/service/shared/transformers/to-module-ref';
import { toSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';
import type { InferResultType } from 'groqd';

import type { homePageQuery } from './query';
import type { THomePage } from './types';

export type TRawHomePage = InferResultType<typeof homePageQuery>;

export function toHomePage(raw: TRawHomePage): THomePage {
  return {
    title: raw.title,
    hero: toModuleRef(raw.hero),
    modules: (raw.modules ?? []).map(toModuleRef),
    seo: raw.seo ? toSeoMeta(raw.seo) : undefined,
  };
}
