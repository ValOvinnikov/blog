import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { childPagesModuleQuery } from './query';
import type { TChildPagesModuleDocument } from './types';

export type TRawChildPagesModule = InferResultType<
  typeof childPagesModuleQuery
>;

export function toChildPagesModuleDocument(
  raw: TRawChildPagesModule,
): TChildPagesModuleDocument {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
