/** Default posts per blog index page — the pagination window size. */
export const POSTS_PER_PAGE = 9;

/** Total number of index pages for a given post count (min 1). */
export function toTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
