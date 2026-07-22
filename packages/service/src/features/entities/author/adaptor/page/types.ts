import type { TAuthorDetail } from '@blog/service/features/entities/author/adaptor/detail-page/types';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TAuthorPage = {
  author: TAuthorDetail;
  posts: TPostCard[];
};
