import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { postRelatedModuleQuery } from './query';
import type { TPostRelatedModuleDocument } from './types';

export type TRawPostRelatedModule = InferResultType<
  typeof postRelatedModuleQuery
>;

export function toPostRelatedModuleDocument(
  raw: TRawPostRelatedModule,
): TPostRelatedModuleDocument {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    limit: raw.limit,
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    showImages: raw.showImages,
  };
}
