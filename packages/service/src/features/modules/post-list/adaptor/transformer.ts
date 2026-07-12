import type { InferResultType } from 'groqd';

import { toPostCard } from '#/shared/transformers/to-post-card';

import type { postListModulePostsQuery } from './posts.query';
import type { postListModuleQuery } from './query';
import type { TPostListModule } from './types';

export type TRawPostListModule = InferResultType<typeof postListModuleQuery>;
export type TRawPostListModulePosts = InferResultType<
  typeof postListModulePostsQuery
>;

export function toPostListModule(
  raw: TRawPostListModule,
  rawPosts: TRawPostListModulePosts,
): TPostListModule {
  return {
    title: raw.title,
    posts: rawPosts.slice(0, raw.limit).map(toPostCard),
  };
}
