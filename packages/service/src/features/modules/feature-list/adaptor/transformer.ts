import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import type { InferResultType } from 'groqd';

import type { featureListModuleQuery } from './query';
import type { TFeatureListItem, TFeatureListModule } from './types';

export type TRawFeatureListModule = InferResultType<
  typeof featureListModuleQuery
>;

type TRawFeatureListItem = NonNullable<
  TRawFeatureListModule['features']
>[number];

function toFeatureListItem(raw: TRawFeatureListItem): TFeatureListItem {
  return {
    id: raw._id,
    headingBlock: toHeadingBlock(raw.headingBlock),
    sanityImage: toSanityImage(raw.image),
    icon: raw.icon ?? undefined,
    link: toLinkDocument(raw.link),
  };
}

// Mirrors the schema's own `min(2)` cards rule — fewer than 2 cards degrades
// to an empty list rather than failing the whole module.
function toFeatureListItems(
  raw: TRawFeatureListModule['features'],
): TFeatureListItem[] {
  if (!raw || raw.length < 2) return [];

  return raw.map(toFeatureListItem);
}

export function toFeatureListModule(
  raw: TRawFeatureListModule,
): TFeatureListModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    items: toFeatureListItems(raw.features),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    imageShape: raw.imageShape,
    displayMode: raw.displayMode,
    contentAlignment: raw.contentAlignment ?? undefined,
    cardAlignment: raw.cardAlignment,
    layout: toLayout(raw.layout),
  };
}
