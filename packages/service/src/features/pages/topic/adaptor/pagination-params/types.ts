import type { InferResultType } from 'groqd';

import type { topicPaginationParamsQuery } from './query';

export type TTopicPaginatedPage = InferResultType<
  typeof topicPaginationParamsQuery
>[number];
