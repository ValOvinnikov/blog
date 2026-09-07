/**
 * A `module_taxonomyList` placement must resolve `taxonomy` from either its
 * authored field or a caller-supplied fallback; publish validation is
 * expected to prevent an authored placement with neither, so this signals a
 * data-integrity failure rather than an ordinary empty state.
 */
export class UnresolvedTaxonomyError extends Error {
  readonly code = 'MODULE_TAXONOMY_LIST_UNRESOLVED' as const;

  constructor() {
    super('module_taxonomyList has no resolvable taxonomy');
  }
}
