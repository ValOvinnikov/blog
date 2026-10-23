export const PAGE_SIZE = 25;

export const parsePage = (raw: unknown): number => {
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
};

export const countPages = (total: number): number =>
  Math.max(1, Math.ceil(total / PAGE_SIZE));
