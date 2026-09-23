import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import { toPortableText } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { InferResultType } from 'groqd';

import type { testimonialModuleQuery } from './query';
import type { TTestimonialItem, TTestimonialModule } from './types';

export type TRawTestimonialModule = InferResultType<
  typeof testimonialModuleQuery
>;

type TRawTestimonialItem = TRawTestimonialModule['testimonials'][number];

function toTestimonialItem(raw: TRawTestimonialItem): TTestimonialItem {
  return {
    id: raw._id,
    name: raw.name,
    quote: raw.quote.map(toPortableText),
    role: raw.role ?? undefined,
    image: toSanityImage(raw.image),
    link: toLinkDocument(raw.link),
  };
}

export function toTestimonialModule(
  raw: TRawTestimonialModule,
): TTestimonialModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    testimonials: raw.testimonials.map(toTestimonialItem),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    displayMode: raw.displayMode,
    cardAlignment: raw.cardAlignment ?? undefined,
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
