import {
  toPostCard,
  type TPostCard,
} from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { relatedByCategoryQuery, relatedByTagsQuery } from './query';

export type TRawRelatedByTags = InferResultType<typeof relatedByTagsQuery>;
export type TRawRelatedByCategory = InferResultType<
  typeof relatedByCategoryQuery
>;

const RELATED_POSTS_LIMIT = 3;

/**
 * Ranks the shared-tag candidate pool by exact shared-tag count desc,
 * `publishedAt` desc tiebreak, then backfills any remaining slots (up to
 * `RELATED_POSTS_LIMIT`) from the primary-category candidate pool —
 * excluding posts already picked by the tag ranking.
 */
export function toRelatedPosts(
  byTags: TRawRelatedByTags,
  byCategory: TRawRelatedByCategory,
  currentTagIds: string[],
): TPostCard[] {
  const ranked = byTags
    .map((raw) => ({
      raw,
      sharedTagCount: (raw.tagIds ?? []).filter((tag) =>
        currentTagIds.includes(tag._id),
      ).length,
    }))
    .sort((a, b) => {
      if (b.sharedTagCount !== a.sharedTagCount) {
        return b.sharedTagCount - a.sharedTagCount;
      }
      return b.raw.publishedAt.localeCompare(a.raw.publishedAt);
    })
    .slice(0, RELATED_POSTS_LIMIT)
    .map(({ raw }) => toPostCard(raw));

  if (ranked.length >= RELATED_POSTS_LIMIT) return ranked;

  const rankedIds = new Set(ranked.map((post) => post.id));
  const backfill = byCategory
    .filter((raw) => !rankedIds.has(raw._id))
    .slice(0, RELATED_POSTS_LIMIT - ranked.length)
    .map(toPostCard);

  return [...ranked, ...backfill];
}
