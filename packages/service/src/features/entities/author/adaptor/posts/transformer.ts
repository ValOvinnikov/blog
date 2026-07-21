import {
  toPostCard,
  type TPostCard,
} from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { authorPostsQuery } from './query';

type TRawAuthorPosts = InferResultType<typeof authorPostsQuery>;

export function toAuthorPosts(raw: TRawAuthorPosts): TPostCard[] {
  return raw.map(toPostCard);
}
