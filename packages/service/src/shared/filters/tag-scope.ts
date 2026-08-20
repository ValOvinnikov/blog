/**
 * `filterBy`'s strong typing only covers simple equality/comparison
 * expressions; the `in` operator across a dereferenced array isn't
 * supported, so this stays a `filterRaw` call.
 */
export const TAG_SCOPE_FILTER = '$slug in tags[]->slug.current';
