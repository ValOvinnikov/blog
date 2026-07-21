import { toTotalPages } from '@blog/utils';

export type TCategoryPostsTotal = {
  slug: string;
  total: number;
};

/** Raw per-category totals → the `{ slug, page }` array for pages 2…N (page 1 is `/category/[slug]`). */
export function toCategoryPaginationParams(
  categories: TCategoryPostsTotal[],
  itemsPerPage: number,
): { slug: string; page: string }[] {
  return categories.flatMap(({ slug, total }) => {
    const totalPages = toTotalPages(total, itemsPerPage);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
