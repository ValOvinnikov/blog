import {
  CTA_VARIANT,
  type TContentAlignment,
  type TMaybeUndefined,
  type TPortableTextBlock,
} from '@blog/config';
import { toCtaButtons } from '@blog/service/shared/transformers/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toPortableText } from '@blog/service/shared/transformers/to-portable-text-mark-def';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { ctaModuleQuery } from './query';
import type { TCtaModule } from './types';

export type TRawCtaModule = InferResultType<typeof ctaModuleQuery>;

function toContent(
  raw: TRawCtaModule['content'],
): TMaybeUndefined<TPortableTextBlock[]> {
  if (!raw || raw.length === 0) return undefined;
  return raw.map(toPortableText);
}

function toContentPosition(
  raw: TRawCtaModule,
): TMaybeUndefined<TContentAlignment> {
  switch (raw.variant) {
    case CTA_VARIANT.SPLIT:
      return raw.contentPositionSplit ?? undefined;
    case CTA_VARIANT.BANNER:
      return raw.contentPositionBanner ?? undefined;
    case CTA_VARIANT.CALLOUT:
      return undefined;
  }
}

export function toCtaModule(raw: TRawCtaModule): TCtaModule {
  return {
    variant: raw.variant,
    brandVariant: raw.brandVariant,
    bandTone: raw.bandTone,
    eyebrow: raw.eyebrow ?? undefined,
    headingBlock: toHeadingBlock(raw.headingBlock),
    content: toContent(raw.content),
    image: toSanityImage(raw.image),
    contentPosition: toContentPosition(raw),
    contentAlignment: raw.contentAlignment ?? undefined,
    mobileMediaOrder: raw.mobileMediaOrder ?? undefined,
    ctaButtons: toCtaButtons(raw.ctaButtons),
    footnote: raw.footnote ?? undefined,
    layout: toLayout(raw.layout),
  };
}
