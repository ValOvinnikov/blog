import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { postListModulePostsQuery } from './posts.query';
import type { postListModuleQuery } from './query';
import type { TPostListModule } from './types';

export type TRawPostListModule = InferResultType<typeof postListModuleQuery>;
export type TRawPostListModulePosts = InferResultType<
  ReturnType<typeof postListModulePostsQuery>
>;

export function toPostListModule(
  raw: TRawPostListModule,
  rawPosts: TRawPostListModulePosts,
): TPostListModule {
  // The posts query already applied `limit` in GROQ, so no JS slice here.
  return {
    title: raw.title,
    posts: rawPosts.map(toPostCard),
  };
}
