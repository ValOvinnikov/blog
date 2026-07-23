import type { TArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import type { TCategory } from '@blog/service/shared/transformers/to-category';

export type TCategoryPage = {
  category: TCategory;
  posts: TArchivePostCard[];
  currentPage: number;
  totalPages: number;
};
