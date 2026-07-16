import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TBlogIndexPage = {
  heading: string;
  supportingText?: string;
  seo: TSeoResolved;
  posts: TPostCard[];
  currentPage: number;
  totalPages: number;
  total: number;
};
