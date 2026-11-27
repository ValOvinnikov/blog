import { redirect } from 'next/navigation';

export type TPageHref = (page: number) => string;

export type TResolveTotalPagesInput = {
  page: number;
  total: number;
  pageSize: number;
  pageHref: TPageHref;
};

export const parsePage = (raw: unknown): number => {
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
};

export const countPages = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));

export type TPageRange = {
  from: number;
  to: number;
  count: number;
};

export type TPageRangeInput = {
  page: number;
  pageSize: number;
  rowCount: number;
  total: number;
};

export const toPageRange = ({
  page,
  pageSize,
  rowCount,
  total,
}: TPageRangeInput): TPageRange => {
  const from = (page - 1) * pageSize + 1;
  return { from, to: from + rowCount - 1, count: total };
};

export const resolveTotalPages = ({
  page,
  total,
  pageSize,
  pageHref,
}: TResolveTotalPagesInput): number => {
  const totalPages = countPages(total, pageSize);
  if (page > totalPages) redirect(pageHref(totalPages));
  return totalPages;
};
