export const LEADS_PAGE_SIZE = 25;

export const parseLeadsPage = (raw: unknown): number => {
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
};

export const countLeadsPages = (total: number): number =>
  Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));
