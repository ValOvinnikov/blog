import {
  toArchivePostCard,
  type TArchivePostCard,
} from '@blog/service/shared/transformers/to-archive-post-card';
import type { InferResultType } from 'groqd';

import type { buildAuthorPostsPageQuery } from './query';

type TRawAuthorPosts = InferResultType<
  ReturnType<typeof buildAuthorPostsPageQuery>
>['posts'];

// `total` stays on this intermediate DTO — `getAuthorPage` needs the raw
// count to compute `totalPages`, even though the public `TAuthorPage` view
// model no longer exposes `total` itself.
export type TAuthorPosts = {
  posts: TArchivePostCard[];
  total: number;
};

export function toAuthorPosts(
  rawPosts: TRawAuthorPosts,
  total: number,
): TAuthorPosts {
  return { posts: rawPosts.map(toArchivePostCard), total };
}
