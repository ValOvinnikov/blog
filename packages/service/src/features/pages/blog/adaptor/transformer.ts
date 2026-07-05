import type { InferResultType } from 'groqd';

import { toPostCard } from '#/shared/transformers/to-post-card';

import type { blogListQuery } from './query';
import type { TBlogPage } from './types';

export function toBlogPage(
  raw: InferResultType<typeof blogListQuery>,
): TBlogPage {
  return {
    posts: raw.map(toPostCard),
  };
}
