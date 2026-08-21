import { toTag } from '@blog/service/shared/transformers/to-tag';
import type { InferResultType } from 'groqd';

import type { tagsQuery } from './query';
import type { TTagsList, TTagWithPostCount } from './types';

export type TRawTagWithPostCount = InferResultType<typeof tagsQuery>[number];

function toTagWithPostCount(raw: TRawTagWithPostCount): TTagWithPostCount {
  return {
    ...toTag(raw),
    description: raw.description ?? undefined,
    postCount: raw.postCount,
  };
}

export function toTags(raw: InferResultType<typeof tagsQuery>): TTagsList {
  return raw.map(toTagWithPostCount);
}
