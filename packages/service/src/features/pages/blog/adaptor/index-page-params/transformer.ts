import { POSTS_PER_PAGE } from '@blog/service/features/pages/blog/adaptor/pagination';
import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { indexPageParamsQuery } from './query';

export type TRawIndexPageParams = InferResultType<typeof indexPageParamsQuery>;

/** Raw count + itemsPerPage → the generateStaticParams array for pages 2…N (page 1 is /blog). */
export function toIndexPageParams(
  raw: TRawIndexPageParams,
): { page: string }[] {
  const pageSize = raw.itemsPerPage ?? POSTS_PER_PAGE;
  const totalPages = toTotalPages(raw.total, pageSize);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}
