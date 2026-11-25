import { toCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';
import { toCtaButtons } from '@shinefold/service/shared/transformers/cta/to-cta-buttons';
import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toSanityImage } from '@shinefold/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import { toPortableText } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { InferResultType } from 'groqd';

import type { featureHighlightsModuleQuery } from './query';
import type { TFeatureHighlightItem, TFeatureHighlightsModule } from './types';

export type TRawFeatureHighlightsModule = InferResultType<
  typeof featureHighlightsModuleQuery
>;

type TRawFeatureHighlightItem = NonNullable<
  TRawFeatureHighlightsModule['highlights']
>[number];

function toFeatureHighlightItem(
  raw: TRawFeatureHighlightItem,
): TFeatureHighlightItem {
  return {
    id: raw._key,
    heading: raw.heading,
    body: raw.body.map(toPortableText),
    image: toSanityImage(raw.image),
    action: raw.action ? toCtaButton(raw.action) : undefined,
  };
}

export function toFeatureHighlightsModule(
  raw: TRawFeatureHighlightsModule,
): TFeatureHighlightsModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    highlights: raw.highlights.map(toFeatureHighlightItem),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    mediaOrder: raw.mediaOrder,
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
