import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  title: string;
  posts: TPostCard[];
};
