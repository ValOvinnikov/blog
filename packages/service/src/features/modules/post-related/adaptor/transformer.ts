import type { TImageTenant } from '@blog/service/sanity/image';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import {
  toPostCard,
  type TPostCard,
} from '@blog/service/shared/transformers/to-post-card';
import { toSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { relatedByTagsQuery, relatedByTopicQuery } from './posts.query';
import type { postRelatedModuleQuery } from './query';
import type { TPostRelatedModule } from './types';

export type TRawPostRelatedModule = InferResultType<
  typeof postRelatedModuleQuery
>;
export type TRawRelatedByTags = InferResultType<typeof relatedByTagsQuery>;
export type TRawRelatedByTopic = InferResultType<
  ReturnType<typeof relatedByTopicQuery>
>;

/**
 * Ranks the shared-tag candidate pool by exact shared-tag count desc,
 * `publishedAt` desc tiebreak, then backfills any remaining slots (up to
 * `limit`) from the primary-topic candidate pool — excluding posts already
 * picked by the tag ranking.
 */
export function toRelatedPosts(
  byTags: TRawRelatedByTags,
  byTopic: TRawRelatedByTopic,
  currentTagIds: string[],
  limit: number,
  tenant: TImageTenant,
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
    .map(({ raw }) => toPostCard(raw, tenant));

  if (ranked.length >= limit) return ranked;

  const rankedIds = new Set(ranked.map((post) => post.id));
  const backfill = byTopic
    .filter((raw) => !rankedIds.has(raw._id))
    .slice(0, limit - ranked.length)
    .map((raw) => toPostCard(raw, tenant));

  return [...ranked, ...backfill];
}

export function toPostRelatedModule(
  raw: TRawPostRelatedModule,
  posts: TPostCard[],
): TPostRelatedModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: raw.sectionHeader
      ? toSectionHeader(raw.sectionHeader)
      : { heading: undefined, supportingText: undefined },
    posts,
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    showImages: raw.showImages,
  };
}
