/**
 * Max tag-sharing candidates fetched+projected before the JS shared-tag
 * ranking runs — bounds the query so a popular tag can't fetch an
 * unbounded set.
 */
export const RELATED_POSTS_TAG_CANDIDATE_LIMIT = 24;

/**
 * Multiplies the module's own `limit` to size the topic-backfill candidate
 * pool, giving enough dedup headroom against posts already picked by the
 * tag ranking.
 */
export const RELATED_POSTS_TOPIC_CANDIDATE_MULTIPLIER = 2;
