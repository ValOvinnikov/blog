import type { InferResultType } from 'groqd';

import { toCategory } from '#/shared/transformers/to-category';
import { toPostCard } from '#/shared/transformers/to-post-card';

import type { categoryPageCategoryQuery } from './category.query';
import type { categoryPagePostsQuery } from './posts.query';
import type { TCategoryPage } from './types';

type TRawCategory = NonNullable<
  InferResultType<typeof categoryPageCategoryQuery>
>;
type TRawPosts = InferResultType<typeof categoryPagePostsQuery>;

export function toCategoryPage(
  rawCategory: TRawCategory,
  rawPosts: TRawPosts,
): TCategoryPage {
  return {
    category: toCategory(rawCategory),
    posts: rawPosts.map(toPostCard),
  };
}
