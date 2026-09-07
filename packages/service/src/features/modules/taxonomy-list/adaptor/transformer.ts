import { TAXONOMY_KIND, TAXONOMY_SORT } from '@blog/config';
import { toTags } from '@blog/service/features/entities/tags/adaptor/transformer';
import { toTopics } from '@blog/service/features/entities/topics/adaptor/transformer';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { taxonomyListModuleQuery } from './query';
import type { TTaxonomyEntry, TTaxonomyListModule } from './types';
import { UnresolvedTaxonomyError } from './unresolved-taxonomy-error';

export type TRawTaxonomyListModule = InferResultType<
  typeof taxonomyListModuleQuery
>;

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
    raw.taxonomy === TAXONOMY_KIND.TOPICS
      ? toTopics(raw.entries)
      : toTags(raw.entries),
    raw.sortOrder,
  ).slice(0, raw.limit ?? undefined);

  return {
    brandVariant: raw.brandVariant,
    sectionHeader: raw.sectionHeader
      ? toSectionHeader(raw.sectionHeader)
      : { heading: undefined, supportingText: undefined },
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    taxonomy: raw.taxonomy,
    entries,
  };
}
