import type { TCategory } from '@blog/service/shared/transformers/to-category';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TCategoryPage = {
  category: TCategory;
  posts: TPostCard[];
  // Present only when `getCategoryPage` was called with a `page` — the
  // unpaginated call site (#91) gets the full, unsliced post list and no
  // pagination metadata.
  currentPage?: number;
  totalPages?: number;
  total?: number;
};
