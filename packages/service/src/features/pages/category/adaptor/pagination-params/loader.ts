import { buildCategoryPostsPageQuery } from '@blog/service/features/pages/category/adaptor/detail/posts.query';
import { categoryParamsQuery } from '@blog/service/features/pages/category/adaptor/params/query';
import { isr, runQuery } from '@blog/service/sanity/query';

import { toCategoryPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every category's pages 2…N. Each
 * category needs its own post count, so this fans out one count-only query
 * per category slug (in parallel) after listing the slugs — there is no
 * single GROQ projection that correlates a category's own slug into its
 * post count without per-document scoping.
 *
 * `itemsPerPage` has no default here — categories have no CMS-authored
 * page-size field like `page_blog.itemsPerPage`, so the caller must pass
 * the same value it also passes to `getCategoryPage`'s `itemsPerPage` arg,
 * or the two will disagree on how many pages exist.
 */
export async function getCategoryPaginationParams(
  itemsPerPage: number,
): Promise<{ slug: string; page: string }[]> {
  const categories = await runQuery(categoryParamsQuery, isr('categories'));
  const totals = await Promise.all(
    categories.map(async ({ slug }) => {
      const { total } = await runQuery(buildCategoryPostsPageQuery(0, 0), {
        parameters: { slug },
        ...isr('posts'),
      });
      return { slug, total };
    }),
  );
  return toCategoryPaginationParams(totals, itemsPerPage);
}
