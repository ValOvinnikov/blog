/** Max related posts returned to the caller (post-ranking, post-backfill). */
export const RELATED_POSTS_LIMIT = 3;

/**
 * Max tag-sharing candidates fetched+projected before the JS shared-tag
 * ranking runs — bounds the query so a popular tag can't fetch an
 * unbounded set.
 */
export const RELATED_POSTS_CANDIDATE_LIMIT = 24;
