import type { TMaybeNull } from '@shinefold/config';

const CANONICAL_POSITIVE_INT = /^[1-9]\d*$/;

/** Accepts only the canonical form, so `02` or `1e2` 404s instead of duplicating a page. */
export const parsePageParam = (raw: string): TMaybeNull<number> => {
  if (!CANONICAL_POSITIVE_INT.test(raw)) return null;
  return Number(raw);
};
