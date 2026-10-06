import {
  toPostCard,
  type TPostCard,
} from '@blog/service/shared/transformers/post/to-post-card';
import type { InferResultType } from 'groqd';

import type { relatedByTagsQuery } from './by-tags.query';
import type { relatedByTopicQuery } from './by-topic.query';

export type TRawRelatedByTags = InferResultType<typeof relatedByTagsQuery>;
export type TRawRelatedByTopic = InferResultType<
  ReturnType<typeof relatedByTopicQuery>
>;

export function toRelatedPosts(
  byTags: TRawRelatedByTags,
  byTopic: TRawRelatedByTopic,
  currentTagIds: string[],
  limit: number,
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
    .slice(0, limit)
    .map(({ raw }) => toPostCard(raw));

  if (ranked.length >= limit) return ranked;

  const rankedIds = new Set(ranked.map((post) => post.id));
  const backfill = byTopic
    .filter((raw) => !rankedIds.has(raw._id))
    .slice(0, limit - ranked.length)
    .map((raw) => toPostCard(raw));

  return [...ranked, ...backfill];
}
