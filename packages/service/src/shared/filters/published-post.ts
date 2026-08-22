/**
 * `publishedAt` is a required field on both `blog_post` and `page_post` —
 * until now it was only ever used for sort order/display, no query gated on
 * it. Chain this raw GROQ condition alongside a `.filterByType(...)` on
 * either type (via `.filterRaw(PUBLISHED_POST_FILTER)`) so a scheduled post
 * stays excluded from every listing, count, and its own detail-page lookup
 * until its date arrives.
 */
export const PUBLISHED_POST_FILTER = 'publishedAt <= now()';
