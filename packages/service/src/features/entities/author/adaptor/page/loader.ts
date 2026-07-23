import { getAuthor } from '@blog/service/features/entities/author/adaptor/detail-page/loader';
import { getAuthorPosts } from '@blog/service/features/entities/author/adaptor/posts/loader';
import { toTotalPages } from '@blog/utils';

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
 * caller decides the value. Returns `null` when the author itself isn't
 * found, regardless of what `getAuthorPosts` resolved to.
 */
export async function getAuthorPage(
  slug: string,
  { page = 1, itemsPerPage }: TGetAuthorPageArgs,
): Promise<TAuthorPage | null> {
  const [author, { posts, total }] = await Promise.all([
    getAuthor(slug),
    getAuthorPosts(slug, { page, itemsPerPage }),
  ]);
  if (!author) return null;
  return {
    author,
    posts,
    currentPage: page,
    totalPages: toTotalPages(total, itemsPerPage),
    total,
  };
}
