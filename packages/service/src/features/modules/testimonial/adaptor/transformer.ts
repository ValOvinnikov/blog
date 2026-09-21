import { toCtaButtons } from '@blog/service/shared/transformers/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toLinkDocument } from '@blog/service/shared/transformers/to-link-document';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { testimonialModuleQuery } from './query';
import type { TTestimonialItem, TTestimonialModule } from './types';

export type TRawTestimonialModule = InferResultType<
  typeof testimonialModuleQuery
>;

type TRawTestimonialItem = NonNullable<
  TRawTestimonialModule['testimonials']
>[number];

function toTestimonialItem(raw: TRawTestimonialItem): TTestimonialItem {
  return {
    id: raw._id,
    quote: raw.quote,
    name: raw.name,
    role: raw.role ?? undefined,
    photo: toSanityImage(raw.photo),
    link: toLinkDocument(raw.link),
  };
}

// Schema `min(1)` isn't enforced on documents written outside Studio, so an absent array degrades to empty rather than throwing.
function toTestimonialItems(
  raw: TRawTestimonialModule['testimonials'],
): TTestimonialItem[] {
  return (raw ?? []).map(toTestimonialItem);
}

export function toTestimonialModule(
  raw: TRawTestimonialModule,
): TTestimonialModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    testimonials: toTestimonialItems(raw.testimonials),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    showImages: raw.showImages,
    displayMode: raw.displayMode,
    contentAlignment: raw.contentAlignment ?? undefined,
    cardAlignment: raw.cardAlignment,
    layout: toLayout(raw.layout),
  };
}
