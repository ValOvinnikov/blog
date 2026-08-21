import { MissingPostListError } from '@blog/service/features/pages/blog/adaptor/missing-post-list-error';
import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { indexPageParamsQuery } from './query';

export type TRawIndexPageParams = InferResultType<typeof indexPageParamsQuery>;

/** Raw count + the archive's pageSize → the generateStaticParams array for pages 2…N (page 1 is /blog). */
export function toIndexPageParams(
  raw: TRawIndexPageParams,
): { page: string }[] {
  if (!raw.postList) {
    throw new MissingPostListError();
  }
  const totalPages = toTotalPages(raw.blogPosts.total, raw.postList.pageSize);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}
