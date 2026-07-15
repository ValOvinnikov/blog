import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';

export type TBlogIndexPage = {
  heading: string;
  supportingText?: string;
  seo?: TSeoMeta;
  posts: TPostCard[];
  currentPage: number;
  totalPages: number;
  total: number;
};
