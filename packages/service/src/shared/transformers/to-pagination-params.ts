import { toTotalPages } from '@blog/utils';

export type TRawPaginationParamsPage = {
  slug: string;
  pageSize: number | null;
  postCount: number;
};

export type TPaginationParam = { slug: string; page: string };

/**
 * Raw per-page slug + post count + first list module's page size → the
 * `{ slug, page }` array for pages 2…N (page 1 is the route's own slug page).
 *
 * A page with no list module in `modules[]` contributes no entries here
 * rather than failing the whole call — the caller's query spans every page
 * of its kind in one round-trip, so one unfinished page must not block the
 * rest.
 */
export function toPaginationParams(
  pages: TRawPaginationParamsPage[],
): TPaginationParam[] {
  return pages.flatMap(({ slug, pageSize, postCount }) => {
    if (!pageSize) return [];
    const totalPages = toTotalPages(postCount, pageSize);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }));
  });
}
