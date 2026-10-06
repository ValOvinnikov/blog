import type { TChildPageCard } from '@blog/service/features/modules/child-pages/adaptor/pages/types';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { childPagesModuleQuery } from './query';
import type { TChildPagesModule } from './types';

export type TRawChildPagesModule = InferResultType<
  typeof childPagesModuleQuery
>;

export function toChildPagesModule(
  raw: TRawChildPagesModule,
  pages: TChildPageCard[],
): TChildPagesModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    pages,
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
