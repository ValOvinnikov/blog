import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { tagPaginationParamsQuery } from './query';

export type TRawTagPostCount = InferResultType<
  typeof tagPaginationParamsQuery
>[number];

/** Raw per-tag slug + post-count entries → the `{ slug, page }` array for pages 2…N (page 1 is `/tag/[slug]`). */
export function toTagPaginationParams(
  tags: TRawTagPostCount[],
  itemsPerPage: number,
): { slug: string; page: string }[] {
  return tags.flatMap(({ slug, postCount }) => {
    const totalPages = toTotalPages(postCount, itemsPerPage);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
