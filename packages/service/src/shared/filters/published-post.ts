/**
 * `publishedAt` is a required `blog_post` field, but until now it was only
 * ever used for sort order/display — no query gated on it. Chain this raw
 * GROQ condition alongside every `.filterByType('blog_post')` (via
 * `.filterRaw(PUBLISHED_POST_FILTER)`) so a scheduled post with a
 * future-dated `publishedAt` stays excluded from every listing, count, and
 * the post's own detail-page lookup until its date arrives.
 */
export const PUBLISHED_POST_FILTER = 'publishedAt <= now()';
