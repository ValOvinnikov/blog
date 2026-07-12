import type { InferResultType } from 'groqd';

import type { contentModuleQuery } from './query';
import type { TContentModule } from './types';

export type TRawContentModule = InferResultType<typeof contentModuleQuery>;

export function toContentModule(raw: TRawContentModule): TContentModule {
  return {
    title: raw.title,
    body: raw.body,
  };
}
