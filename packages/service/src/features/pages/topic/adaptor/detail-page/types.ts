import type { TArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import type { TTopic } from '@blog/service/shared/transformers/to-topic';

export type TTopicPage = {
  topic: TTopic;
  posts: TArchivePostCard[];
  currentPage: number;
  totalPages: number;
};
