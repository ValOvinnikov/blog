import { isr, runQuery } from '@blog/service/sanity/query';

import { topicPaginationParamsQuery } from './query';
import { toTopicPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every topic's pages 2…N. A
 * single correlated query returns every topic's slug and post count in
 * one round-trip (see `./query.ts`) — no per-slug fan-out.
 *
 * `itemsPerPage` has no default here — topics have no CMS-authored
 * page-size field like `page_blog.itemsPerPage`, so the caller must pass
 * the same value it also passes to `getTopicPage`'s `itemsPerPage` arg,
 * or the two will disagree on how many pages exist.
 */
export async function getTopicPaginationParams(
  itemsPerPage: number,
): Promise<{ slug: string; page: string }[]> {
  const topics = await runQuery(
    topicPaginationParamsQuery,
    isr(['topics', 'posts']),
  );
  return toTopicPaginationParams(topics, itemsPerPage);
}
