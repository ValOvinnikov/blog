import {
  toCtaButton,
  type TCtaButton,
} from '@blog/service/shared/transformers/to-cta-button';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toHeroPresentation } from '@blog/service/shared/transformers/to-hero-presentation';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { heroStatementModuleQuery } from './query';
import type { THeroStatementModule } from './types';

export type TRawHeroStatementModule = InferResultType<
  typeof heroStatementModuleQuery
>;

function toCtaButtons(
  raw: TRawHeroStatementModule['ctaButtons'],
): TCtaButton[] {
  if (!raw || raw.length === 0) return [];

  return raw
    .map(toCtaButton)
    .filter((button): button is TCtaButton => button !== undefined);
}

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
