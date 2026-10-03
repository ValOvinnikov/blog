import {
  BRAND_VARIANT,
  CTA_VARIANT,
  type TContentAlignment,
  type TMaybeUndefined,
  type TPortableTextBlock,
} from '@blog/config';
import {
  pickLocalized,
  type TPickLocalizedLanguages,
} from '@blog/service/shared/localization/pick-localized';
import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toPortableText } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { InferResultType } from 'groqd';

import type { ctaModuleQuery } from './query';
import type { TCtaModule } from './types';

export type TRawCtaModule = InferResultType<typeof ctaModuleQuery>;

function toContent(
  raw: TRawCtaModule['content'],
  languages: TPickLocalizedLanguages,
): TMaybeUndefined<TPortableTextBlock[]> {
  const blocks = pickLocalized(raw, languages);
  if (!blocks || blocks.length === 0) return undefined;
  return blocks.map(toPortableText);
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

function toImage(
  raw: TRawCtaModule['image'],
  languages: TPickLocalizedLanguages,
) {
  if (!raw) return undefined;
  return toSanityImage({ ...raw, alt: pickLocalized(raw.alt, languages) });
}

function toCtaHeadingBlock(
  raw: TRawCtaModule['headingBlock'],
  languages: TPickLocalizedLanguages,
) {
  const heading = pickLocalized(raw.heading, languages);
  if (heading === null) {
    throw new Error('CTA module has no heading in any language');
  }

  return toHeadingBlock({
    heading,
    supportingText: pickLocalized(raw.supportingText, languages),
  });
}

export function toCtaModule(
  raw: TRawCtaModule,
  languages: TPickLocalizedLanguages,
): TCtaModule {
  return {
    variant: raw.variant,
    brandVariant: raw.brandVariant,
    bandTone: raw.bandTone ?? BRAND_VARIANT.PRIMARY,
    eyebrow: pickLocalized(raw.eyebrow, languages) ?? undefined,
    headingBlock: toCtaHeadingBlock(raw.headingBlock, languages),
    content: toContent(raw.content, languages),
    image: toImage(raw.image, languages),
    contentPosition: toContentPosition(raw),
    contentAlignment: raw.contentAlignment ?? undefined,
    mobileMediaOrder: raw.mobileMediaOrder ?? undefined,
    ctaButtons: toCtaButtons(raw.ctaButtons),
    footnote: pickLocalized(raw.footnote, languages) ?? undefined,
    layout: toLayout(raw.layout),
  };
}
