import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { topicPaginationParamsQuery } from './query';
import { toTopicPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every topic page's pages 2…N. A
 * single correlated query returns every topic page's slug, post count, and
 * archive page size in one round-trip (see `./query.ts`) — no per-slug
 * fan-out.
 */
export async function getTopicPaginationParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string; page: string }[]> {
  const topicPages = await runQuery(topicPaginationParamsQuery, {
    tenant,
    ...isr(
      ['page_topic', 'modules:postList', 'posts', 'topic'],
      tenant.projectId,
    ),
  });
  return toTopicPaginationParams(topicPages);
}
