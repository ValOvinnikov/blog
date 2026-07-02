import type { InferResultType } from 'groqd';
import type { TPostCard } from '#/shared/types';
import { toPostCard } from '#/shared/to-post-card';
import { blogListQuery } from './query';

export type TBlogPage = {
  posts: TPostCard[];
};

export function toBlogPage(
  raw: InferResultType<typeof blogListQuery>,
): TBlogPage {
  return {
    posts: raw.map(toPostCard),
  };
}
