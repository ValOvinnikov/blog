import type { TImageTenant } from '@blog/service/sanity/image';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toPortableTextBody } from '@blog/service/shared/transformers/to-portable-text-body';
import type { InferResultType } from 'groqd';

import type { contentModuleQuery } from './query';
import type { TContentModule } from './types';

export type TRawContentModule = InferResultType<typeof contentModuleQuery>;

export function toContentModule(
  raw: TRawContentModule,
  tenant: TImageTenant,
): TContentModule {
  return {
    brandVariant: raw.brandVariant,
    body: toPortableTextBody(raw.body, tenant),
    layout: toLayout(raw.layout),
  };
}
