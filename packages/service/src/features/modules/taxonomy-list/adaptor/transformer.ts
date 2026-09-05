import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { taxonomyListModuleQuery } from './query';
import type { TTaxonomyEntry, TTaxonomyListModule } from './types';

export type TRawTaxonomyListModule = InferResultType<
  typeof taxonomyListModuleQuery
>;

export function toTaxonomyListModule(
  raw: TRawTaxonomyListModule,
  entries: TTaxonomyEntry[],
): TTaxonomyListModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: raw.sectionHeader
      ? toSectionHeader(raw.sectionHeader)
      : { heading: undefined, supportingText: undefined },
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    entries,
  };
}
