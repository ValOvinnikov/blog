import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { topicPaginationParamsQuery } from './query';

export type TRawTopicPostCount = InferResultType<
  typeof topicPaginationParamsQuery
>[number];

/** Raw per-topic slug + post-count entries → the `{ slug, page }` array for pages 2…N (page 1 is `/topics/[slug]`). */
export function toTopicPaginationParams(
  topics: TRawTopicPostCount[],
  itemsPerPage: number,
): { slug: string; page: string }[] {
  return topics.flatMap(({ slug, postCount }) => {
    const totalPages = toTotalPages(postCount, itemsPerPage);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
