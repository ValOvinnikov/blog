import { toCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toPortableText } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { InferResultType } from 'groqd';

import type { featureHighlightsModuleQuery } from './query';
import type { TFeatureHighlightItem, TFeatureHighlightsModule } from './types';

export type TRawFeatureHighlightsModule = InferResultType<
  typeof featureHighlightsModuleQuery
>;

type TRawFeatureHighlightItem = NonNullable<
  TRawFeatureHighlightsModule['highlights']
>[number];

class UnresolvedFeatureHighlightImageError extends Error {
  readonly code = 'UNRESOLVED_FEATURE_HIGHLIGHT_IMAGE' as const;

  constructor(heading: string) {
    super(
      `Feature highlight "${heading}"'s image was accepted by the query but failed to resolve to an asset.`,
    );
  }
}

function toFeatureHighlightItem(
  raw: TRawFeatureHighlightItem,
): TFeatureHighlightItem {
  const image = toSanityImage(raw.image);

  if (!image) {
    throw new UnresolvedFeatureHighlightImageError(raw.heading);
  }

  return {
    id: raw._key,
    heading: raw.heading,
    body: raw.body.map(toPortableText),
    image,
    action: raw.action ? toCtaButton(raw.action) : undefined,
  };
}

export function toFeatureHighlightsModule(
  raw: TRawFeatureHighlightsModule,
): TFeatureHighlightsModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    highlights: raw.highlights.map(toFeatureHighlightItem),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    mediaOrder: raw.mediaOrder,
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
