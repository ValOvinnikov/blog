import { toTotalPages } from '@blog/utils';

export type TRawIndexPageParams = {
  blogPosts: { total: number };
  pageSize: number | null;
};

export function toIndexPageParams(
  raw: TRawIndexPageParams,
): { page: string }[] {
  const totalPages = raw.pageSize
    ? toTotalPages(raw.blogPosts.total, raw.pageSize)
    : 1;
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}
