import { redirect } from 'next/navigation';

export type TResolveTotalPagesInput = {
  page: number;
  total: number;
  pageSize: number;
  pageHref: (page: number) => string;
};

export const parsePage = (raw: unknown): number => {
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
};

export const countPages = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));

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
