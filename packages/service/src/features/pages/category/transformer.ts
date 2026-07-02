import type { InferResultType } from 'groqd';
import type { TPostCard, TCategory } from '#/shared/types';
import { toPostCard } from '#/shared/to-post-card';
import { categoryPageCategoryQuery, categoryPagePostsQuery } from './query';

type TRawCategory = NonNullable<
  InferResultType<typeof categoryPageCategoryQuery>
>;
type TRawPosts = InferResultType<typeof categoryPagePostsQuery>;

export type TCategoryPage = {
  category: TCategory;
  posts: TPostCard[];
};

export function toCategoryPage(
  rawCategory: TRawCategory,
  rawPosts: TRawPosts,
): TCategoryPage {
  return {
    category: {
      id: rawCategory._id,
      title: rawCategory.title ?? '',
      slug: rawCategory.slug ?? '',
      description: rawCategory.description ?? null,
    },
    posts: rawPosts.map(toPostCard),
  };
}
