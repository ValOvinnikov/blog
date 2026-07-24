import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { authorPaginationParamsQuery } from './query';

export type TRawAuthorPostCount = InferResultType<
  typeof authorPaginationParamsQuery
>[number];

/** Raw per-author slug + post-count entries → the `{ slug, page }` array for pages 2…N (page 1 is `/author/[slug]`). */
export function toAuthorPaginationParams(
  authors: TRawAuthorPostCount[],
  itemsPerPage: number,
): { slug: string; page: string }[] {
  return authors.flatMap(({ slug, postCount }) => {
    const totalPages = toTotalPages(postCount, itemsPerPage);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
