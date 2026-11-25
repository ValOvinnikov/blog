import { TAXONOMY_SORT } from '@shinefold/config';
import type { postLinkFragment } from '@shinefold/service/shared/fragments/post/post-link';
import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import type { InferFragmentType, InferResultType } from 'groqd';

import type { taxonomyListModuleQuery } from './query';
import type { TPostLink, TTaxonomyEntry, TTaxonomyListModule } from './types';

export type TRawTaxonomyListModule = InferResultType<
  typeof taxonomyListModuleQuery
>;

type TRawTaxonomyEntry = NonNullable<TRawTaxonomyListModule['entries']>[number];

type TRawPostLink = InferFragmentType<typeof postLinkFragment>;

function toPostLink(raw: TRawPostLink): TPostLink {
  return {
    id: raw._id,
    title: raw.headingBlock.heading,
    slug: raw.slug,
  };
}

function toTaxonomyEntry(raw: TRawTaxonomyEntry): TTaxonomyEntry {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug ?? undefined,
    description: raw.description ?? undefined,
    postCount: raw.postCount,
    latestPosts: raw.latestPosts.map(toPostLink),
  };
}

function orderEntries(
  entries: TTaxonomyEntry[],
  sortOrder: TRawTaxonomyListModule['sortOrder'],
): TTaxonomyEntry[] {
  if (sortOrder === TAXONOMY_SORT.MOST_POSTS) {
    return [...entries].sort(
      (a, b) => b.postCount - a.postCount || a.title.localeCompare(b.title),
    );
  }

  return entries;
}

export function toTaxonomyListModule(
  raw: TRawTaxonomyListModule,
): TTaxonomyListModule {
  const entries = orderEntries(
    (raw.entries ?? []).map(toTaxonomyEntry),
    raw.sortOrder,
  ).slice(0, raw.limit ?? undefined);

  return {
    brandVariant: raw.brandVariant,
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    taxonomy: raw.taxonomy ?? undefined,
    showLatestPosts: raw.showLatestPosts,
    entries,
  };
}
