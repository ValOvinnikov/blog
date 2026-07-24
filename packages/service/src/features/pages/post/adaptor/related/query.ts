import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

import {
  RELATED_POSTS_CATEGORY_CANDIDATE_LIMIT,
  RELATED_POSTS_TAG_CANDIDATE_LIMIT,
} from './constants';

export type TRelatedByTagsParams = {
  currentId: string;
  tagIds: string[];
};

export type TRelatedByCategoryParams = {
  currentId: string;
  categoryId: string;
};

/**
 * Candidate pool of published posts sharing at least one tag with the
 * current post. groqd's typed `.order()` only accepts a literal projected
 * field path, not a raw `count(...)` expression, so the exact
 * shared-tag-count ranking (desc, `publishedAt` tiebreak) can't be expressed
 * in the query itself — this fetches the `RELATED_POSTS_TAG_CANDIDATE_LIMIT`
 * most recent qualifying candidates plus each candidate's own tag ids, and
 * `toRelatedPosts` computes the exact rank in JS over that bounded set.
 * `RELATED_POSTS_TAG_CANDIDATE_LIMIT` is a deliberate cap: large enough that
 * a genuinely closer (higher shared-tag-count) match published slightly
 * earlier than the cutoff is vanishingly unlikely to be missed, but bounded
 * so a popular tag can't grow this fetch unboundedly (mirrors
 * `relatedByCategoryQuery`'s `RELATED_POSTS_CATEGORY_CANDIDATE_LIMIT` bound
 * below).
 */
export const relatedByTagsQuery = q
  .parameters<TRelatedByTagsParams>()
  .star.filterByType('blog_post')
  .filterRaw('_id != $currentId && count((tags[]->_id)[@ in $tagIds]) > 0')
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

/** Recency-ordered backfill pool from the post's primary category. */
export const relatedByCategoryQuery = q
  .parameters<TRelatedByCategoryParams>()
  .star.filterByType('blog_post')
  .filterRaw('_id != $currentId && category._ref == $categoryId')
  .order('publishedAt desc')
  .slice(0, RELATED_POSTS_CATEGORY_CANDIDATE_LIMIT)
  .project(postCardFragment);
