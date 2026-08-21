/**
 * `page_topicIndex.taxonomyList` is required in the schema, but the query
 * projects it as nullable — absence is a data-integrity failure, not a
 * state the page can render around, so callers throw this rather than
 * substituting a fallback slot.
 */
export class MissingTaxonomyListError extends Error {
  readonly code = 'TOPIC_INDEX_TAXONOMY_LIST_MISSING' as const;

  constructor() {
    super('page_topicIndex.taxonomyList is not set');
  }
}
