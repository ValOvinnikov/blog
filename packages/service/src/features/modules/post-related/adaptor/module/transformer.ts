import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import { toModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';
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
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    limit: raw.limit,
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    showImages: raw.showImages,
    displayMode: raw.displayMode,
    ...toModuleAppearance(raw),
  };
}
