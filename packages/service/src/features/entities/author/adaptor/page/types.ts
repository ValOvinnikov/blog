import type { TAuthorDetail } from '@blog/service/features/entities/author/adaptor/detail-page/types';
import type { TArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';

export type TAuthorPage = {
  author: TAuthorDetail;
  posts: TArchivePostCard[];
  currentPage: number;
  totalPages: number;
};
