/**
 * `publishedAt` is a required field on `page_post`. Chain this raw GROQ
 * condition alongside `.filterByType('page_post')` (via
 * `.filterRaw(PUBLISHED_POST_FILTER)`) so a scheduled post stays excluded
 * from every listing, count, and its own detail-page lookup until its date
 * arrives.
 */
export const PUBLISHED_POST_FILTER = 'publishedAt <= now()';
