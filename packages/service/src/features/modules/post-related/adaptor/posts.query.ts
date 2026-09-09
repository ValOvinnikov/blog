import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post';

import { RELATED_POSTS_TAG_CANDIDATE_LIMIT } from './constants';

export type TAnchorPostParams = {
  postId: string;
};

export type TRelatedByTagsParams = {
  currentId: string;
  tagIds: string[];
};

export type TRelatedByTopicParams = {
  currentId: string;
  topicId: string;
};

/** The module's anchor post's own tag and topic ids, used to rank/backfill candidates. */
export const relatedPostAnchorQuery = q
  .parameters<TAnchorPostParams>()
  .star.filterByType('page_post')
  .filterRaw('_id == $postId')
  .slice(0)
  .project((sub) => ({
    tagIds: sub
      .field('tags[]')
      .deref()
      .project(() => ({ _id: true }))
      .nullable(true),
    topicId: sub
      .field('topic')
      .deref()
      .project(() => ({ _id: true }))
      .nullable(true),
  }))
  .nullable(true);

/**
 * Candidate pool of published posts sharing at least one tag with the anchor
 * post. groqd's typed `.order()` only accepts a literal projected field, not
 * a raw `count(...)` expression, so the exact shared-tag-count ranking runs
 * in JS (`toRelatedPosts`) over this candidate set instead.
 */
export const relatedByTagsQuery = q
  .parameters<TRelatedByTagsParams>()
  .star.filterByType('page_post')
  .filterRaw('_id != $currentId && count((tags[]->_id)[@ in $tagIds]) > 0')
  .filterRaw(PUBLISHED_POST_FILTER)
  .order('publishedAt desc')
  .slice(0, RELATED_POSTS_TAG_CANDIDATE_LIMIT)
  .project((sub) => ({
    ...postCardFragment,
    tagIds: sub
      .field('tags[]')
      .deref()
      .project(() => ({ _id: true }))
      .nullable(true),
  }));

/**
 * Recency-ordered backfill pool from the anchor post's primary topic,
 * bounded by `topicCandidateLimit` (the module's own `limit`, doubled, for
 * dedup headroom against the tag results).
 */
export function relatedByTopicQuery(topicCandidateLimit: number) {
  return q
    .parameters<TRelatedByTopicParams>()
    .star.filterByType('page_post')
    .filterRaw('_id != $currentId && topic._ref == $topicId')
    .filterRaw(PUBLISHED_POST_FILTER)
    .order('publishedAt desc')
    .slice(0, topicCandidateLimit)
    .project(postCardFragment);
}
