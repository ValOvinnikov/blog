import { isr, runQuery } from '@blog/service/sanity/query';

import { categoryPaginationParamsQuery } from './query';
import { toCategoryPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every category's pages 2…N. A
 * single correlated query returns every category's slug and post count in
 * one round-trip (see `./query.ts`) — no per-slug fan-out.
 *
 * `itemsPerPage` has no default here — categories have no CMS-authored
 * page-size field like `page_blog.itemsPerPage`, so the caller must pass
 * the same value it also passes to `getCategoryPage`'s `itemsPerPage` arg,
 * or the two will disagree on how many pages exist.
 */
export async function getCategoryPaginationParams(
  itemsPerPage: number,
): Promise<{ slug: string; page: string }[]> {
  const categories = await runQuery(
    categoryPaginationParamsQuery,
    isr(['categories', 'posts']),
  );
  return toCategoryPaginationParams(categories, itemsPerPage);
}
