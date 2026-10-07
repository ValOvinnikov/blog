import type { InferResultType } from 'groqd';

import type { indexPageParamsQuery } from './query';

export type TIndexPagePagination = InferResultType<typeof indexPageParamsQuery>;
