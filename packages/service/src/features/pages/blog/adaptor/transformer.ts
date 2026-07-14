import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { buildBlogListQuery } from './query';
import type { TBlogPage } from './types';

type TRawBlogList = InferResultType<ReturnType<typeof buildBlogListQuery>>;

export function toBlogPage(
  rawPosts: TRawBlogList,
  total: number,
  currentPage: number,
  pageSize: number,
): TBlogPage {
  return {
    posts: rawPosts.map(toPostCard),
    currentPage,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    total,
  };
}
