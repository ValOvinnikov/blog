import {
  BRAND_VARIANT,
  CTA_VARIANT,
  type TContentAlignment,
  type TMaybeUndefined,
  type TPortableTextBlock,
} from '@shinefold/config';
import { toCtaButtons } from '@shinefold/service/shared/transformers/cta/to-cta-buttons';
import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toSanityImage } from '@shinefold/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import {
  toModuleAppearance,
  type TModuleAppearance,
} from '@shinefold/service/shared/transformers/module/to-module-appearance';
import { toPortableText } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-mark-def';
import { hasLength } from '@shinefold/utils/primitives';
import type { InferResultType } from 'groqd';

import type { ctaModuleQuery } from './query';
import type { TCtaModule } from './types';

export type TRawCtaModule = InferResultType<typeof ctaModuleQuery>;

function toContent(
  raw: TRawCtaModule['content'],
): TMaybeUndefined<TPortableTextBlock[]> {
  if (!raw || !hasLength(raw)) return undefined;
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

function toCardOverrides(raw: TRawCtaModule): TModuleAppearance {
  if (raw.variant === CTA_VARIANT.BANNER) {
    return {
      cardStyle: undefined,
      radiusScale: undefined,
      density: undefined,
      columns: undefined,
    };
  }
  return toModuleAppearance(raw);
}

export function toCtaModule(raw: TRawCtaModule): TCtaModule {
  return {
    variant: raw.variant,
    brandVariant: raw.brandVariant,
    bandTone: raw.bandTone ?? BRAND_VARIANT.PRIMARY,
    eyebrow: raw.eyebrow ?? undefined,
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    content: toContent(raw.content),
    image: toSanityImage(raw.image),
    contentPosition: toContentPosition(raw),
    contentAlignment: raw.contentAlignment ?? undefined,
    mobileMediaOrder: raw.mobileMediaOrder ?? undefined,
    ctaButtons: toCtaButtons(raw.ctaButtons),
    footnote: raw.footnote ?? undefined,
    layout: toLayout(raw.layout),
    ...toCardOverrides(raw),
  };
}
