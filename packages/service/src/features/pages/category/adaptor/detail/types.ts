import type { TCategory } from '#/shared/transformers/to-category';
import type { TPostCard } from '#/shared/transformers/to-post-card';

export type TCategoryPage = {
  category: TCategory;
  posts: TPostCard[];
};
