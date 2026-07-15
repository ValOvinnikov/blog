import { toTotalPages } from '@blog/service/features/pages/blog/adaptor/pagination';
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
    totalPages: toTotalPages(raw.total, pageSize),
    total: raw.total,
  };
}
