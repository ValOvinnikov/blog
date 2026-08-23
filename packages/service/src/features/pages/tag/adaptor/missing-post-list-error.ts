/**
 * `page_tag.postList` is an optional reference, but absence is a
 * data-integrity failure, not a state the tag page can render around —
 * callers throw this rather than substituting a fallback slot.
 */
export class MissingPostListError extends Error {
  readonly code = 'TAG_POST_LIST_MISSING' as const;

  constructor() {
    super('page_tag.postList is not set');
  }
}
