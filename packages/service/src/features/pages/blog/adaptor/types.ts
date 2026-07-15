import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TBlogPage = {
  posts: TPostCard[];
  currentPage: number;
  totalPages: number;
  total: number;
};
