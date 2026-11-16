import { toCtaButtons } from '@shinefold/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-heading-block';
import { toHeroPresentation } from '@shinefold/service/shared/transformers/hero/to-hero-presentation';
import { toSanityImage } from '@shinefold/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { heroStatementModuleQuery } from './query';
import type { THeroStatementModule } from './types';

export type TRawHeroStatementModule = InferResultType<
  typeof heroStatementModuleQuery
>;

export function toHeroStatementModule(
  raw: TRawHeroStatementModule,
): THeroStatementModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    eyebrow: raw.eyebrow ?? undefined,
    sanityImage: toSanityImage(raw.image),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    presentation: toHeroPresentation(raw),
    layout: toLayout(raw.layout),
  };
}
