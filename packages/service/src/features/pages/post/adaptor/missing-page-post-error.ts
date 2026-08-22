/**
 * Thrown when no `page_post` matches the requested slug — `/blog/{slug}`
 * has no runtime fallback for this state, so callers 404 rather than
 * substitute content.
 */
export class MissingPagePostError extends Error {
  readonly code = 'PAGE_POST_MISSING' as const;

  constructor(slug: string) {
    super(`No page_post found for slug "${slug}"`);
  }
}
