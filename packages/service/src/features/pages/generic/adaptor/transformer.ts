import type { InferResultType } from 'groqd';

import { toModuleRef } from '#/shared/transformers/to-module-ref';
import { toSeoMeta } from '#/shared/transformers/to-seo-meta';

import type { genericPageQuery } from './query';
import type { TGenericPage } from './types';

export type TRawGenericPage = InferResultType<typeof genericPageQuery>;

export function toGenericPage(raw: TRawGenericPage): TGenericPage {
  return {
    title: raw.title,
    slug: raw.slug,
    modules: (raw.modules ?? []).map(toModuleRef),
    seo: raw.seo ? toSeoMeta(raw.seo) : undefined,
  };
}
