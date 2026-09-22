import type { ReferenceFilterSearchOptions } from 'sanity';

/**
 * Mirrors `PUBLISHED_POST_FILTER`
 * (`packages/service/src/shared/expressions/published-post.ts`) so Studio's
 * reference picker and validation queries track exactly what the runtime
 * hero/spotlight query considers published. `@blog/studio` cannot import
 * `@blog/service`, so the condition is duplicated here — keep the two in
 * sync by hand.
 */
export const PUBLISHED_POST_CONDITION = 'publishedAt <= now()';

export const publishedPostFilter = (): ReferenceFilterSearchOptions => ({
  filter: PUBLISHED_POST_CONDITION,
  params: {},
});
