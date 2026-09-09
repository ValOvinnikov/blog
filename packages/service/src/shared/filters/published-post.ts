/**
 * A `page_post` is publishable only once it has a `publishedAt` date that
 * has arrived and an authored `sectionHeader.heading`. Chain this raw GROQ
 * condition alongside `.filterByType('page_post')` (via
 * `.filterRaw(PUBLISHED_POST_FILTER)`) so a scheduled post, or one with no
 * title yet, stays excluded from every listing, count, and its own
 * detail-page lookup.
 */
export const PUBLISHED_POST_FILTER =
  'publishedAt <= now() && defined(sectionHeader.heading)';
