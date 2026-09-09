import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { indexPageParamsQuery } from './query';

export type TRawIndexPageParams = InferResultType<typeof indexPageParamsQuery>;

/** Raw count + the first list module's pageSize → the generateStaticParams array for pages 2…N (page 1 is /blog); no list module means a single, unpaginated page. */
export function toIndexPageParams(
  raw: TRawIndexPageParams,
): { page: string }[] {
  const totalPages = raw.pageSize
    ? toTotalPages(raw.blogPosts.total, raw.pageSize)
    : 1;
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}
