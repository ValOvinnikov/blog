import type { TCategory } from '@blog/service/shared/transformers/to-category';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TCategoryPage = {
  category: TCategory;
  posts: TPostCard[];
  currentPage: number;
  totalPages: number;
  total: number;
};
