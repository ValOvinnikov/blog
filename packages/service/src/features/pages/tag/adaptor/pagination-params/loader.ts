import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { tagPaginationParamsQuery } from './query';
import { toTagPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every tag page's pages 2…N. A
 * single correlated query returns every tag page's slug, post count, and
 * archive page size in one round-trip (see `./query.ts`) — no per-slug
 * fan-out.
 */
export async function getTagPaginationParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string; page: string }[]> {
  const tagPages = await runQuery(tagPaginationParamsQuery, {
    tenant,
    ...isr(['page_tag', 'modules:postList', 'posts', 'tag'], tenant.projectId),
  });
  return toTagPaginationParams(tagPages);
}
