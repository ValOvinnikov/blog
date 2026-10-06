import type { InferResultType } from 'groqd';

import type { tagPaginationParamsQuery } from './query';

export type TTagPaginatedPage = InferResultType<
  typeof tagPaginationParamsQuery
>[number];
