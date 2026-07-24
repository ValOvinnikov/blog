import { isr, runQuery } from '@blog/service/sanity/query';

import { authorPaginationParamsQuery } from './query';
import { toAuthorPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every author's pages 2…N. A single
 * correlated query returns every author's slug and post count in one
 * round-trip (see `./query.ts`) — no per-slug fan-out.
 *
 * `itemsPerPage` has no default here — authors have no CMS-authored
 * page-size field like `page_blog.itemsPerPage`, so the caller must pass
 * the same value it also passes to `getAuthorPage`'s `itemsPerPage` arg, or
 * the two will disagree on how many pages exist.
 */
export async function getAuthorPaginationParams(
  itemsPerPage: number,
): Promise<{ slug: string; page: string }[]> {
  const authors = await runQuery(
    authorPaginationParamsQuery,
    isr(['author', 'posts']),
  );
  return toAuthorPaginationParams(authors, itemsPerPage);
}
