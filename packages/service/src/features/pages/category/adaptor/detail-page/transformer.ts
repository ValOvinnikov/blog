import { toArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import { toCategory } from '@blog/service/shared/transformers/to-category';
import type { InferResultType } from 'groqd';

import type { categoryPageCategoryQuery } from './category.query';
import type { buildCategoryPostsPageQuery } from './posts.query';
import type { TCategoryPage } from './types';

type TRawCategory = NonNullable<
  InferResultType<typeof categoryPageCategoryQuery>
>;
type TRawPosts = InferResultType<
  ReturnType<typeof buildCategoryPostsPageQuery>
>['posts'];

export type TCategoryPagePagination = {
  currentPage: number;
  totalPages: number;
};

export function toCategoryPage(
  rawCategory: TRawCategory,
  rawPosts: TRawPosts,
  pagination: TCategoryPagePagination,
): TCategoryPage {
  return {
    category: toCategory(rawCategory),
    posts: rawPosts.map(toArchivePostCard),
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
  };
}
