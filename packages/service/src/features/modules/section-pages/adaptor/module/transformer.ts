import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { sectionPagesModuleQuery } from './query';
import type { TSectionPagesModuleDocument } from './types';

export type TRawSectionPagesModule = InferResultType<
  typeof sectionPagesModuleQuery
>;

export function toSectionPagesModuleDocument(
  raw: TRawSectionPagesModule,
): TSectionPagesModuleDocument {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
