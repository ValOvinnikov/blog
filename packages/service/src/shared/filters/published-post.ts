/**
 * A `page_post` is publishable only once it has a `publishedAt` date that
 * has arrived, an authored `headingBlock.heading`, an `author`, a `topic`,
 * `content`, and `seo.metaTitle`. Chain this raw GROQ condition alongside
 * `.filterByType('page_post')` (via `.filterRaw(PUBLISHED_POST_FILTER)`) so
 * a scheduled post, or one missing any of those required fields, stays
 * excluded from every listing, count, and its own detail-page lookup.
 */
export const PUBLISHED_POST_FILTER =
  'publishedAt <= now() && defined(headingBlock.heading) && defined(author) && defined(topic) && defined(content) && defined(seo.metaTitle)';
