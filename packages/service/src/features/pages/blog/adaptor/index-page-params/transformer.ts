import { toTotalPages } from '@blog/utils';

/** Raw count → the generateStaticParams array for pages 2…N (page 1 is /blog). */
export function toIndexPageParams(
  total: number,
  pageSize: number,
): { page: string }[] {
  const totalPages = toTotalPages(total, pageSize);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}
