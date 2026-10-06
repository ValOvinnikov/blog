import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import type { InferResultType } from 'groqd';

import type { postRelatedModuleQuery } from './query';
import type { TPostRelatedModule } from './types';

export type TRawPostRelatedModule = InferResultType<
  typeof postRelatedModuleQuery
>;

export function toPostRelatedModule(
  raw: TRawPostRelatedModule,
  posts: TPostCard[],
): TPostRelatedModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    posts,
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    showImages: raw.showImages,
  };
}
