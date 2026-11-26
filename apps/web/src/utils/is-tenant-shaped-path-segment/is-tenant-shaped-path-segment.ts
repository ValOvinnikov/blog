// Prefix match, so trailing garbage after a real tenant id cannot evade the refusal.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const EXACT_UUID_PATTERN = new RegExp(`${UUID_PATTERN.source}$`, 'i');

/** Refuses a client-supplied segment shaped like the `[tenant]` param `proxy.ts` writes. */
export const isTenantShapedPathSegment = (segment: string): boolean => {
  return UUID_PATTERN.test(segment);
};

export const isValidTenantId = (segment: string): boolean => {
  return EXACT_UUID_PATTERN.test(segment);
};
