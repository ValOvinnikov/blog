import type { TPostCard } from '#/shared/transformers/to-post-card';

export type THomePage = {
  featuredPosts: TPostCard[];
  recentPosts: TPostCard[];
};
