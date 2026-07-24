import { isr, runQuery } from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { categoryPageCategoryQuery } from './category.query';
import { buildCategoryPostsPageQuery } from './posts.query';
import { toCategoryPage } from './transformer';
import type { TCategoryPage } from './types';

type TGetCategoryPageArgs = {
  page?: number;
  itemsPerPage: number;
};

/**
 * Always windows, mirroring the blog index (`getIndexPage`) — `page`
 * defaults to 1 so the unnumbered `/category/[slug]` route gets the same
 * sliced-query + pagination-metadata shape as `/category/[slug]/page/[page]`
 * (pages ≥ 2). Categories have no CMS-authored page-size field like
 * `page_blog.itemsPerPage`, so `itemsPerPage` is always required — the
 * caller (`CATEGORY_ITEMS_PER_PAGE` on the web side) decides the value.
 */
export async function getCategoryPage(
  slug: string,
  { page = 1, itemsPerPage }: TGetCategoryPageArgs,
): Promise<TCategoryPage | null> {
  const start = (page - 1) * itemsPerPage;
  const [rawCategory, rawPosts] = await Promise.all([
    runQuery(categoryPageCategoryQuery, {
      parameters: { slug },
      ...isr('category'),
    }),
    // `archivePostCardFragment` derefs `category` — that tag must ride
    // alongside `posts` (tag-scope contract, `sanity/query.ts`).
    runQuery(buildCategoryPostsPageQuery(start, start + itemsPerPage), {
      parameters: { slug },
      ...isr(['posts', 'category']),
    }),
  ]);
  if (!rawCategory) return null;
  return toCategoryPage(rawCategory, rawPosts.posts, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, itemsPerPage),
  });
}
