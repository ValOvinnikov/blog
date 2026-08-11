import { toLayout } from '@blog/service/shared/transformers/to-layout';
import type { InferResultType } from 'groqd';

import type { contentModuleQuery } from './query';
import type { TContentModule } from './types';

export type TRawContentModule = InferResultType<typeof contentModuleQuery>;

export function toContentModule(raw: TRawContentModule): TContentModule {
  return {
    brandVariant: raw.brandVariant,
    body: raw.body,
    layout: toLayout(raw.layout),
  };
}
