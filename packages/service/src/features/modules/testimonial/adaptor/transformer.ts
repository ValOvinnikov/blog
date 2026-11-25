import { toCtaButtons } from '@shinefold/service/shared/transformers/cta/to-cta-buttons';
import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toSanityImage } from '@shinefold/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import { toLinkDocument } from '@shinefold/service/shared/transformers/link/to-link-document';
import { toModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';
import { toPortableText } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-mark-def';
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
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    testimonials: raw.testimonials.map(toTestimonialItem),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    displayMode: raw.displayMode,
    cardAlignment: raw.cardAlignment,
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
    ...toModuleAppearance(raw),
  };
}
