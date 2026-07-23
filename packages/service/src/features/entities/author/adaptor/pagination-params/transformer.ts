import { toTotalPages } from '@blog/utils';

export type TAuthorPostsTotal = {
  slug: string;
  total: number;
};

/** Raw per-author totals → the `{ slug, page }` array for pages 2…N (page 1 is `/author/[slug]`). */
export function toAuthorPaginationParams(
  authors: TAuthorPostsTotal[],
  itemsPerPage: number,
): { slug: string; page: string }[] {
  return authors.flatMap(({ slug, total }) => {
    const totalPages = toTotalPages(total, itemsPerPage);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
