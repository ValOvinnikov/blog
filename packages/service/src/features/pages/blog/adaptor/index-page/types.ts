import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TBlogIndexPage = {
  heading: string;
  supportingText?: string;
  modules: TModule[];
  seo: TSeoResolved;
  posts: TArchivePostCard[];
  currentPage: number;
  totalPages: number;
};
