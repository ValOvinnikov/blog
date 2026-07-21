import { buildCategoryPostsPageQuery } from '@blog/service/features/pages/category/adaptor/detail/posts.query';
import { categoryParamsQuery } from '@blog/service/features/pages/category/adaptor/params/query';
import { CATEGORY_POSTS_PER_PAGE } from '@blog/service/features/pages/category/constants';
import { isr, runQuery } from '@blog/service/sanity/query';

import { toCategoryPaginationParams } from './transformer';

/**
 * Builds the `{ slug, page }` params for every category's pages 2…N. Each
 * category needs its own post count, so this fans out one count-only query
 * per category slug (in parallel) after listing the slugs — there is no
 * single GROQ projection that correlates a category's own slug into its
 * post count without per-document scoping.
 */
export async function getCategoryPaginationParams(): Promise<
  { slug: string; page: string }[]
> {
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
  return toCategoryPaginationParams(totals, CATEGORY_POSTS_PER_PAGE);
}
