import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout/to-layout';
import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card/to-post-card';
import type { InferResultType } from 'groqd';

import type { postLatestModulePostsQuery } from './posts.query';
import type { postLatestModuleQuery } from './query';
import type { TPostLatestModule } from './types';

export type TRawPostLatestModule = InferResultType<
  typeof postLatestModuleQuery
>;
export type TRawPostLatestModulePosts = InferResultType<
  ReturnType<typeof postLatestModulePostsQuery>
>;

export function toPostLatestModule(
  raw: TRawPostLatestModule,
  rawPosts: TRawPostLatestModulePosts,
): TPostLatestModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    posts: rawPosts.map((rawPost) => toPostCard(rawPost)),
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    showImages: raw.showImages,
    displayMode: raw.displayMode,
  };
}
