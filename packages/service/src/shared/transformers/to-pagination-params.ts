import { toTotalPages } from '@blog/utils';

export type TRawPaginationParamsPage = {
  slug: string;
  pageSize: number | null;
  postCount: number;
};

export type TPaginationParam = { slug: string; page: string };

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
