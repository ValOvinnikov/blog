import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { buildIndexPageQuery } from './query';
import type { TBlogIndexPage } from './types';

export type TRawBlogIndexPage = InferResultType<
  ReturnType<typeof buildIndexPageQuery>
>;

export function toIndexPage(
  raw: TRawBlogIndexPage,
  currentPage: number,
  pageSize: number,
): TBlogIndexPage {
  return {
    posts: raw.posts.map(toPostCard),
    currentPage,
    totalPages: Math.max(1, Math.ceil(raw.total / pageSize)),
    total: raw.total,
  };
}
