/**
 * `page_topic.postList` is an optional reference, but absence is a
 * data-integrity failure, not a state the topic page can render around —
 * callers throw this rather than substituting a fallback slot.
 */
export class MissingPostListError extends Error {
  readonly code = 'TOPIC_POST_LIST_MISSING' as const;

  constructor() {
    super('page_topic.postList is not set');
  }
}
