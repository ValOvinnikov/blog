import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toHeroPresentation } from '@blog/service/shared/transformers/hero/to-hero-presentation';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { heroStatementModuleQuery } from './query';
import type { THeroStatementModule } from './types';

export type TRawHeroStatementModule = InferResultType<
  typeof heroStatementModuleQuery
>;

export function toHeroStatementModule(
  raw: TRawHeroStatementModule,
): THeroStatementModule {
  const { contentPosition, mediaOrder } = toHeroPresentation(raw);

  return {
    brandVariant: raw.brandVariant,
    variant: raw.variant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    eyebrow: raw.eyebrow ?? undefined,
    sanityImage: toSanityImage(raw.image),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentPosition,
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder,
    layout: toLayout(raw.layout),
  };
}
