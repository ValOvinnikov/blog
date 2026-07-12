import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { blogListQuery } from './query';
import type { TBlogPage } from './types';

export function toBlogPage(
  raw: InferResultType<typeof blogListQuery>,
): TBlogPage {
  return {
    posts: raw.map(toPostCard),
  };
}
