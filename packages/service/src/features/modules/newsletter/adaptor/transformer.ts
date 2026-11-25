import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
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
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    content: raw.content ?? undefined,
    variant: raw.variant,
    trustCues: raw.trustCues?.flatMap((cue) => (cue.text ? [cue.text] : [])),
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
  };
}
