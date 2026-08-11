import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toRequiredSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { newsletterModuleQuery } from './query';
import type { TNewsletterModule } from './types';

export type TRawNewsletterModule = InferResultType<
  typeof newsletterModuleQuery
>;

export function toNewsletterModule(
  raw: TRawNewsletterModule,
): TNewsletterModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: toRequiredSectionHeader(raw.sectionHeader),
    layout: toLayout(raw.layout),
  };
}
