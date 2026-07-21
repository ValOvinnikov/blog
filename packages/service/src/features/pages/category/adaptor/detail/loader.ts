import { CATEGORY_POSTS_PER_PAGE } from '@blog/service/features/pages/category/constants';
import { isr, runQuery } from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { categoryPageCategoryQuery } from './category.query';
import {
  buildCategoryPostsPageQuery,
  categoryPagePostsQuery,
} from './posts.query';
import { toCategoryPage } from './transformer';
import type { TCategoryPage } from './types';

type TGetCategoryPageArgs = {
  page?: number;
};

/**
 * `page` is left undefined by #91's original unpaginated call site, which
 * fetches every post for the category in one unsliced query. Passing a
 * `page` opts into the sliced, paginated query (fixed page size — see
 * `CATEGORY_POSTS_PER_PAGE`) and populates `currentPage`/`totalPages`/`total`
 * on the returned view-model.
 */
export async function getCategoryPage(
  slug: string,
  { page }: TGetCategoryPageArgs = {},
): Promise<TCategoryPage | null> {
  if (page === undefined) {
    const [rawCategory, rawPosts] = await Promise.all([
      runQuery(categoryPageCategoryQuery, {
        parameters: { slug },
        ...isr('category'),
      }),
      runQuery(categoryPagePostsQuery, {
        parameters: { slug },
        ...isr('posts'),
      }),
    ]);
    if (!rawCategory) return null;
    return toCategoryPage(rawCategory, rawPosts);
  }

  const pageSize = CATEGORY_POSTS_PER_PAGE;
  const start = (page - 1) * pageSize;
  const [rawCategory, rawPosts] = await Promise.all([
    runQuery(categoryPageCategoryQuery, {
      parameters: { slug },
      ...isr('category'),
    }),
    runQuery(buildCategoryPostsPageQuery(start, start + pageSize), {
      parameters: { slug },
      ...isr('posts'),
    }),
  ]);
  if (!rawCategory) return null;
  return toCategoryPage(rawCategory, rawPosts.posts, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, pageSize),
    total: rawPosts.total,
  });
}
