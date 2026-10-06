import type { TLocaleIsoCode } from '@blog/config/constants';
import { toTotalPages } from '@blog/utils';

export type TRawPaginationParamsPage = {
  slug: string;
  language: TLocaleIsoCode;
  pageSize: number | null;
  postCount: number;
};

export type TPaginationParam = {
  slug: string;
  language: TLocaleIsoCode;
  page: string;
};

export function toPaginationParams(
  pages: TRawPaginationParamsPage[],
): TPaginationParam[] {
  return pages.flatMap(({ slug, language, pageSize, postCount }) => {
    if (!pageSize) return [];
    const totalPages = toTotalPages(postCount, pageSize);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      language,
      page: String(i + 2),
    }));
  });
}
