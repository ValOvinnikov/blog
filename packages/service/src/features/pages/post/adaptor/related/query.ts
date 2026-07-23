import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

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
 * in the query itself — this fetches the 24 most recent qualifying
 * candidates plus each candidate's own tag ids, and `toRelatedPosts`
 * computes the exact rank in JS over that bounded set. 24 is a deliberate
 * cap: large enough that a genuinely closer (higher shared-tag-count) match
 * published slightly earlier than the 24th-most-recent candidate is vanishingly
 * unlikely to be missed, but bounded so a popular tag can't grow this fetch
 * unboundedly (mirrors `relatedByCategoryQuery`'s `.slice(0, 6)` bound below).
 */
export const relatedByTagsQuery = q
  .parameters<TRelatedByTagsParams>()
  .star.filterByType('blog_post')
  .filterRaw('_id != $currentId && count((tags[]->_id)[@ in $tagIds]) > 0')
  .order('publishedAt desc')
  .slice(0, 24)
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
  .filterRaw('_id != $currentId && $categoryId in categories[]->_id')
  .order('publishedAt desc')
  .slice(0, 6)
  .project(postCardFragment);
