import type { TPostCard } from '#/shared/transformers/to-post-card';

export type TPostListModule = {
  title: string;
  posts: TPostCard[];
};
