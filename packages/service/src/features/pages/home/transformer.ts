import type { InferResultType } from 'groqd';
import type { TPostCard } from '#/shared/types';
import { toPostCard } from '#/shared/to-post-card';
import { homePageQuery } from './query';

export type THomePage = {
  featuredPosts: TPostCard[];
  recentPosts: TPostCard[];
};

export function toHomePage(raw: InferResultType<typeof homePageQuery>): THomePage {
  const cards = raw.map(toPostCard);
  return {
    featuredPosts: cards.filter((p) => p.featured),
    recentPosts: cards,
  };
}
