import {
  toPostCard,
  type TPostCard,
} from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { buildAuthorPostsPageQuery } from './query';

type TRawAuthorPosts = InferResultType<
  ReturnType<typeof buildAuthorPostsPageQuery>
>['posts'];

export type TAuthorPosts = {
  posts: TPostCard[];
  total: number;
};

export function toAuthorPosts(
  rawPosts: TRawAuthorPosts,
  total: number,
): TAuthorPosts {
  return { posts: rawPosts.map(toPostCard), total };
}
