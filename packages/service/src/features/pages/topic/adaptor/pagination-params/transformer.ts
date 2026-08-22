import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { topicPaginationParamsQuery } from './query';

export type TRawTopicPaginationParams = InferResultType<
  typeof topicPaginationParamsQuery
>[number];

/**
 * Raw per-topic-page slug + post count + archive page size → the
 * `{ slug, page }` array for pages 2…N (page 1 is `/topics/[slug]`).
 *
 * A `page_topic` missing its `postList` slot contributes no entries here
 * rather than failing the whole site's static params — unlike the
 * single-document `page_blog`/`page_topicIndex` loaders, this query spans
 * every topic page in one round-trip, so one unfinished topic page must not
 * block every other topic's pagination. The detail page for that specific
 * topic still throws `MissingPostListError` when rendered.
 */
export function toTopicPaginationParams(
  topicPages: TRawTopicPaginationParams[],
): { slug: string; page: string }[] {
  return topicPages.flatMap(({ slug, postList, postCount }) => {
    if (!postList) return [];
    const totalPages = toTotalPages(postCount, postList.pageSize);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
