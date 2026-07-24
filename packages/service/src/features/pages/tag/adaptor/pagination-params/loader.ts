import { isr, runQuery } from '@blog/service/sanity/query';

import { tagPaginationParamsQuery } from './query';
import { toTagPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every tag's pages 2…N. A single
 * correlated query returns every tag's slug and post count in one
 * round-trip (see `./query.ts`) — no per-slug fan-out.
 *
 * `itemsPerPage` has no default here — tags have no CMS-authored page-size
 * field like `page_blog.itemsPerPage`, so the caller must pass the same
 * value it also passes to `getTagPage`'s `itemsPerPage` arg, or the two
 * will disagree on how many pages exist.
 */
export async function getTagPaginationParams(
  itemsPerPage: number,
): Promise<{ slug: string; page: string }[]> {
  const tags = await runQuery(tagPaginationParamsQuery, isr(['tags', 'posts']));
  return toTagPaginationParams(tags, itemsPerPage);
}
