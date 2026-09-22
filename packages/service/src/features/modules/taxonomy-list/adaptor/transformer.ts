import { TAXONOMY_SORT } from '@blog/config';
import type { postLinkFragment } from '@blog/service/shared/fragments/post-link';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import type { InferFragmentType, InferResultType } from 'groqd';

import type { taxonomyListModuleQuery } from './query';
import type { TPostLink, TTaxonomyEntry, TTaxonomyListModule } from './types';
import { UnresolvedTaxonomyError } from './unresolved-taxonomy-error';

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
    slug: raw.slug,
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
  if (raw.taxonomy === null || raw.entries === null) {
    throw new UnresolvedTaxonomyError();
  }

  const entries = orderEntries(
    raw.entries.map(toTaxonomyEntry),
    raw.sortOrder,
  ).slice(0, raw.limit ?? undefined);

  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    taxonomy: raw.taxonomy,
    showLatestPosts: raw.showLatestPosts,
    entries,
  };
}
