// Prefix match, not exact: a segment need only start with a UUID to be
// refused, so trailing garbage appended to a real tenant id can't evade it.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const EXACT_UUID_PATTERN = new RegExp(`${UUID_PATTERN.source}$`, 'i');

/**
 * True when a path segment is UUID-shaped, the format `proxy.ts` writes the
 * `[tenant]` route param in. A legitimate
 * inbound request never carries one; used to refuse a client-supplied
 * segment before it can be trusted as a route param.
 *
 * @example
 * isTenantShapedPathSegment('a1b2c3d4-e5f6-4789-a012-3456789abcde') // true
 * isTenantShapedPathSegment('blog') // false
 */
export const isTenantShapedPathSegment = (segment: string): boolean => {
  return UUID_PATTERN.test(segment);
};

/**
 * True when a segment is exactly a UUID, the format a genuine `[tenant]`
 * route param always takes. Used to accept a route param as a real tenant
 * id before it reaches a database query — this must be an exact match, not
 * a prefix, or a UUID with trailing garbage appended would be accepted and
 * still fail the query.
 */
export const isValidTenantId = (segment: string): boolean => {
  return EXACT_UUID_PATTERN.test(segment);
};
