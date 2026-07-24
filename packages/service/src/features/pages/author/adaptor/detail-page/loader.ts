import { isr, runQuery } from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { authorPageAuthorQuery } from './author.query';
import { buildAuthorPostsPageQuery } from './posts.query';
import { toAuthorPage } from './transformer';
import type { TAuthorPage } from './types';

type TGetAuthorPageArgs = {
  page?: number;
  itemsPerPage: number;
};

/**
 * Always windows, mirroring the category archive (`getCategoryPage`) —
 * `page` defaults to 1 so the unnumbered `/author/[slug]` route gets the
 * same sliced-query + pagination-metadata shape as `/author/[slug]/page/
 * [page]` (pages ≥ 2). Authors have no CMS-authored page-size field like
 * `page_blog.itemsPerPage`, so `itemsPerPage` is always required — the
 * caller decides the value.
 */
export async function getAuthorPage(
  slug: string,
  { page = 1, itemsPerPage }: TGetAuthorPageArgs,
): Promise<TAuthorPage | null> {
  const start = (page - 1) * itemsPerPage;
  const [rawAuthor, rawPosts] = await Promise.all([
    runQuery(authorPageAuthorQuery, {
      parameters: { slug },
      ...isr('author'),
    }),
    // `archivePostCardFragment` derefs `category` — that tag must ride
    // alongside `posts` (tag-scope contract, `sanity/query.ts`).
    runQuery(buildAuthorPostsPageQuery(start, start + itemsPerPage), {
      parameters: { slug },
      ...isr(['posts', 'category']),
    }),
  ]);
  if (!rawAuthor) return null;
  return toAuthorPage(rawAuthor, rawPosts.posts, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, itemsPerPage),
  });
}
