import { toTopic } from '@blog/service/shared/transformers/to-topic';
import type { InferResultType } from 'groqd';

import type { topicsQuery } from './query';
import type { TTopicsList, TTopicWithPostCount } from './types';

export type TRawTopicWithPostCount = InferResultType<
  typeof topicsQuery
>[number];

function toTopicWithPostCount(
  raw: TRawTopicWithPostCount,
): TTopicWithPostCount {
  return {
    ...toTopic(raw),
    postCount: raw.postCount,
  };
}

export function toTopics(
  raw: InferResultType<typeof topicsQuery>,
): TTopicsList {
  return raw.map(toTopicWithPostCount);
}
