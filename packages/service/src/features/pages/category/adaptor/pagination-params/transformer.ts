import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { categoryPaginationParamsQuery } from './query';

export type TRawCategoryPostCount = InferResultType<
  typeof categoryPaginationParamsQuery
>[number];

/** Raw per-category slug + post-count entries → the `{ slug, page }` array for pages 2…N (page 1 is `/category/[slug]`). */
export function toCategoryPaginationParams(
  categories: TRawCategoryPostCount[],
  itemsPerPage: number,
): { slug: string; page: string }[] {
  return categories.flatMap(({ slug, postCount }) => {
    const totalPages = toTotalPages(postCount, itemsPerPage);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
