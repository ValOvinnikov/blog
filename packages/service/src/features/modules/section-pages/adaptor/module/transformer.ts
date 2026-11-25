import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
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
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
