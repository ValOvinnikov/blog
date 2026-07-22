import { isr, runQuery } from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { categoryPageCategoryQuery } from './category.query';
import {
  buildCategoryPostsPageQuery,
  categoryPagePostsQuery,
} from './posts.query';
import { toCategoryPage } from './transformer';
import type { TCategoryPage } from './types';

type TGetCategoryPageArgs =
  | { page?: undefined; itemsPerPage?: undefined }
  | { page: number; itemsPerPage: number };

/**
 * `page` is left undefined by #91's original unpaginated call site, which
 * fetches every post for the category in one unsliced query. Passing a
 * `page` opts into the sliced, paginated query — categories have no
 * CMS-authored page-size field like `page_blog.itemsPerPage`, so
 * `itemsPerPage` is required alongside `page`; the caller (the eventual
 * `/category/[slug]/page/[page]` route, #589) decides the value. Populates
 * `currentPage`/`totalPages`/`total` on the returned view-model.
 */
export async function getCategoryPage(
  slug: string,
  { page, itemsPerPage }: TGetCategoryPageArgs = {},
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

  const start = (page - 1) * itemsPerPage;
  const [rawCategory, rawPosts] = await Promise.all([
    runQuery(categoryPageCategoryQuery, {
      parameters: { slug },
      ...isr('category'),
    }),
    runQuery(buildCategoryPostsPageQuery(start, start + itemsPerPage), {
      parameters: { slug },
      ...isr('posts'),
    }),
  ]);
  if (!rawCategory) return null;
  return toCategoryPage(rawCategory, rawPosts.posts, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, itemsPerPage),
    total: rawPosts.total,
  });
}
