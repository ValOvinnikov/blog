import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toLink } from '@blog/service/shared/transformers/to-link';
import { toRequiredSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { ctaModuleQuery } from './query';
import type { TCtaModule } from './types';

export type TRawCtaModule = InferResultType<typeof ctaModuleQuery>;

export function toCtaModule(raw: TRawCtaModule): TCtaModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: toRequiredSectionHeader(raw.sectionHeader),
    action: toLink(raw.action),
    layout: toLayout(raw.layout),
  };
}
