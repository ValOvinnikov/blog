import { toModule } from '@blog/service/shared/transformers/to-module';
import { toSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';
import type { InferResultType } from 'groqd';

import type { genericPageQuery } from './query';
import type { TGenericPage } from './types';

export type TRawGenericPage = InferResultType<typeof genericPageQuery>;

export function toGenericPage(raw: TRawGenericPage): TGenericPage {
  return {
    title: raw.title,
    slug: raw.slug,
    modules: (raw.modules ?? []).map(toModule),
    seo: raw.seo ? toSeoMeta(raw.seo) : undefined,
  };
}
