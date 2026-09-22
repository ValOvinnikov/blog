import type { ReferenceFilterSearchOptions } from 'sanity';

// Mirrors PUBLISHED_POST_FILTER — duplicated because @blog/studio cannot import @blog/service; keep the two in sync by hand.
export const PUBLISHED_POST_CONDITION = 'publishedAt <= now()';

export const publishedPostFilter = (): ReferenceFilterSearchOptions => ({
  filter: PUBLISHED_POST_CONDITION,
  params: {},
});
