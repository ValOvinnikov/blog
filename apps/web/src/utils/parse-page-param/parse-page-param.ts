const CANONICAL_POSITIVE_INT = /^[1-9]\d*$/;

/**
 * Parses a pagination path segment. Only the canonical decimal form is
 * accepted — `02`, `1.5`, `1e2` etc. return null so the route can hard-404
 * instead of serving duplicate URLs for the same page.
 */
export function parsePageParam(raw: string): number | null {
  if (!CANONICAL_POSITIVE_INT.test(raw)) return null;
  return Number(raw);
}
