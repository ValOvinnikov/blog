import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { buildBlogPageQuery } from './query';
import type { TBlogPage } from './types';

type TRawBlogPage = InferResultType<ReturnType<typeof buildBlogPageQuery>>;

export function toBlogPage(
  raw: TRawBlogPage,
  currentPage: number,
  pageSize: number,
): TBlogPage {
  return {
    posts: raw.posts.map(toPostCard),
    currentPage,
    totalPages: Math.max(1, Math.ceil(raw.total / pageSize)),
    total: raw.total,
  };
}
