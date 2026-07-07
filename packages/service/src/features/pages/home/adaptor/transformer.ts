import type { InferResultType } from 'groqd';

import { toPostCard } from '#/shared/transformers/to-post-card';

import type { homePageQuery } from './query';
import type { THomePage } from './types';

export function toHomePage(
  raw: InferResultType<typeof homePageQuery>,
): THomePage {
  console.info('toHomePage', raw);
  const cards = raw.map(toPostCard);
  return {
    featuredPosts: cards.filter((p) => p.featured),
    recentPosts: cards,
  };
}
