import { toTotalPages } from '@blog/utils';

export type TTagPostsTotal = {
  slug: string;
  total: number;
};

/** Raw per-tag totals → the `{ slug, page }` array for pages 2…N (page 1 is `/tag/[slug]`). */
export function toTagPaginationParams(
  tags: TTagPostsTotal[],
  itemsPerPage: number,
): { slug: string; page: string }[] {
  return tags.flatMap(({ slug, total }) => {
    const totalPages = toTotalPages(total, itemsPerPage);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
