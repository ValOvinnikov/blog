import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { topicPaginationParamsQuery } from './query';

export type TRawTopicPaginationParams = InferResultType<
  typeof topicPaginationParamsQuery
>[number];

/**
 * Raw per-topic-page slug + post count + first list module's page size →
 * the `{ slug, page }` array for pages 2…N (page 1 is `/topics/[slug]`).
 *
 * A `page_topic` with no list module in `modules[]` contributes no entries
 * here rather than failing the whole site's static params — this query
 * spans every topic page in one round-trip, so one unfinished topic page
 * must not block every other topic's pagination.
 */
export function toTopicPaginationParams(
  topicPages: TRawTopicPaginationParams[],
): { slug: string; page: string }[] {
  return topicPages.flatMap(({ slug, pageSize, postCount }) => {
    if (!pageSize) return [];
    const totalPages = toTotalPages(postCount, pageSize);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
