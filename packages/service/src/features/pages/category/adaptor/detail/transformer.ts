import { toCategory } from '@blog/service/shared/transformers/to-category';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { categoryPageCategoryQuery } from './category.query';
import type { categoryPagePostsQuery } from './posts.query';
import type { TCategoryPage } from './types';

type TRawCategory = NonNullable<
  InferResultType<typeof categoryPageCategoryQuery>
>;
type TRawPosts = InferResultType<typeof categoryPagePostsQuery>;

export type TCategoryPagePagination = {
  currentPage: number;
  totalPages: number;
  total: number;
};

export function toCategoryPage(
  rawCategory: TRawCategory,
  rawPosts: TRawPosts,
  pagination?: TCategoryPagePagination,
): TCategoryPage {
  return {
    category: toCategory(rawCategory),
    posts: rawPosts.map(toPostCard),
    currentPage: pagination?.currentPage,
    totalPages: pagination?.totalPages,
    total: pagination?.total,
  };
}
