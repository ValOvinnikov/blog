/**
 * `page_blog.postList` is an optional reference, but absence is a
 * data-integrity failure, not a state the archive can render around — callers
 * throw this rather than substituting a page size.
 */
export class MissingPostListError extends Error {
  readonly code = 'BLOG_POST_LIST_MISSING' as const;

  constructor() {
    super('page_blog.postList is not set');
  }
}
