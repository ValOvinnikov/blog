import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
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
    headingBlock: toHeadingBlock(raw.headingBlock),
    variant: raw.variant,
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
  };
}
