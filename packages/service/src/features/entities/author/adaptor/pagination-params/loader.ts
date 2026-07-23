import { getAuthorParams } from '@blog/service/features/entities/author/adaptor/detail-page-params/loader';
import { buildAuthorPostsPageQuery } from '@blog/service/features/entities/author/adaptor/posts/query';
import { isr, runQuery } from '@blog/service/sanity/query';

import { toAuthorPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every author's pages 2…N. Each
 * author needs its own post count, so this fans out one count-only query
 * per author slug (in parallel) after listing the slugs via `getAuthorParams`
 * — its `{ slug }[]` shape already matches what this needs, so there is no
 * separate slug-listing query to duplicate here (unlike category, which has
 * no equivalent reusable loader).
 *
 * `itemsPerPage` has no default here — authors have no CMS-authored
 * page-size field like `page_blog.itemsPerPage`, so the caller must pass
 * the same value it also passes to `getAuthorPage`'s `itemsPerPage` arg, or
 * the two will disagree on how many pages exist.
 */
export async function getAuthorPaginationParams(
  itemsPerPage: number,
): Promise<{ slug: string; page: string }[]> {
  const authors = await getAuthorParams();
  const totals = await Promise.all(
    authors.map(async ({ slug }) => {
      const { total } = await runQuery(buildAuthorPostsPageQuery(0, 0), {
        parameters: { slug },
        ...isr('posts'),
      });
      return { slug, total };
    }),
  );
  return toAuthorPaginationParams(totals, itemsPerPage);
}
