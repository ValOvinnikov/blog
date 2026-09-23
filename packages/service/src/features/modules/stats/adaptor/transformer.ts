import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { statsModuleQuery } from './query';
import type { TStatItem, TStatsModule } from './types';

export type TRawStatsModule = InferResultType<typeof statsModuleQuery>;

type TRawStatItem = NonNullable<TRawStatsModule['stats']>[number];

function toStatItem(raw: TRawStatItem): TStatItem {
  return {
    value: raw.value,
    label: raw.label,
    description: raw.description ?? undefined,
  };
}

function toStatItems(raw: TRawStatsModule['stats']): TStatItem[] {
  return (raw ?? []).map(toStatItem);
}

export function toStatsModule(raw: TRawStatsModule): TStatsModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    stats: toStatItems(raw.stats),
    footnote: raw.footnote ?? undefined,
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
