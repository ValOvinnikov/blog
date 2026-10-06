import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import type { InferResultType } from 'groqd';

import type { postsByIdsQuery } from './query';
import type { TPostById } from './types';

export type TRawPostsByIds = InferResultType<typeof postsByIdsQuery>;

export function toPostsByIds(raw: TRawPostsByIds): TPostById[] {
  return raw.map((rawPost) => ({
    ...toPostCard(rawPost),
    language: rawPost.language,
  }));
}
