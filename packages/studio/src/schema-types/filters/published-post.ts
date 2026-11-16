import type { ReferenceFilterSearchOptions } from 'sanity';

// Mirrors PUBLISHED_POST_FILTER — duplicated because @shinefold/studio cannot import @shinefold/service; keep the two in sync by hand.
export const PUBLISHED_POST_CONDITION = 'publishedAt <= now()';

export const publishedPostFilter = (): ReferenceFilterSearchOptions => ({
  filter: PUBLISHED_POST_CONDITION,
  params: {},
});
