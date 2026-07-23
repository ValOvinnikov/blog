/** Max related posts returned to the caller (post-ranking, post-backfill). */
export const RELATED_POSTS_LIMIT = 3;

/**
 * Max tag-sharing candidates fetched+projected before the JS shared-tag
 * ranking runs — bounds the query so a popular tag can't fetch an
 * unbounded set.
 */
export const RELATED_POSTS_TAG_CANDIDATE_LIMIT = 24;

/**
 * Max category-backfill candidates fetched — ~2× `RELATED_POSTS_LIMIT` for
 * dedup headroom against the tag results.
 */
export const RELATED_POSTS_CATEGORY_CANDIDATE_LIMIT = 6;
