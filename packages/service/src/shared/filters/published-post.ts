/**
 * `publishedAt` is a required field on `page_post`. Chain this raw GROQ
 * condition alongside `.filterByType('page_post')` (via
 * `.filterRaw(PUBLISHED_POST_FILTER)`) so a scheduled post stays excluded
 * from every listing, count, and its own detail-page lookup until its date
 * arrives.
 */
export const PUBLISHED_POST_FILTER = 'publishedAt <= now()';

/**
 * Restricts a `page_post` read to documents whose absorbed content fields
 * are actually populated — the schema marks them required, but a document
 * can exist with only its route/identity fields set. Chain alongside
 * `.filterRaw(PUBLISHED_POST_FILTER)` so an incomplete post is excluded
 * everywhere a complete one would be read, the same way an unpublished post
 * is.
 */
export const POST_CONTENT_READY_FILTER =
  'defined(excerpt) && defined(author) && defined(topic) && defined(body)';
