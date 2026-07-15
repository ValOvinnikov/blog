/** Total number of pages for a given item count and page size (never below 1). */
export function toTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
