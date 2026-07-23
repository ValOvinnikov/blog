import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';

export type TBlogIndexPage = {
  heading: string;
  supportingText?: string;
  seo: TSeoResolved;
  posts: TArchivePostCard[];
  currentPage: number;
  totalPages: number;
};
