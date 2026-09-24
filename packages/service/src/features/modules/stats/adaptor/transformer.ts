import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { statsModuleQuery } from './query';
import type { TStatItem, TStatsModule } from './types';

export type TRawStatsModule = InferResultType<typeof statsModuleQuery>;

function toStatItems(raw: TRawStatsModule['stats']): TStatItem[] {
  return raw.map((stat) => ({
    id: stat._key,
    value: stat.value,
    label: stat.label,
    description: stat.description ?? undefined,
  }));
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
