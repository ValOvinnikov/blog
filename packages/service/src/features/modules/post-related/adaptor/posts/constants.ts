// Bounds the shared-tag candidate pool so a popular tag can't fetch an unbounded set before the JS ranking.
export const RELATED_POSTS_TAG_CANDIDATE_LIMIT = 24;

// Sizes the topic-backfill pool at a multiple of the module limit, leaving dedup headroom against tag-ranked picks.
export const RELATED_POSTS_TOPIC_CANDIDATE_MULTIPLIER = 2;
