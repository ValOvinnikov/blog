import { toAppearance } from '@blog/service/shared/transformers/to-appearance';
import type { InferResultType } from 'groqd';

import type { contentModuleQuery } from './query';
import type { TContentModule } from './types';

export type TRawContentModule = InferResultType<typeof contentModuleQuery>;

export function toContentModule(raw: TRawContentModule): TContentModule {
  return {
    brandVariant: raw.brandVariant,
    title: raw.title,
    body: raw.body,
    appearance: toAppearance(raw.appearance),
  };
}
