import type {
  ILink,
  ISanityImage,
  TBrandVariantOf,
  TContentAlignment,
  TDisplayMode,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/to-cta-button';

export type TTestimonialItem = {
  id: string;
  quote: string;
  name: string;
  role: TMaybeUndefined<string>;
  photo: TMaybeUndefined<ISanityImage>;
  link: TMaybeUndefined<ILink>;
};

export type TTestimonialModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  testimonials: TTestimonialItem[];
  ctaButtons: TCtaButton[];
  showImages: boolean;
  displayMode: TDisplayMode;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  cardAlignment: TContentAlignment;
  layout: TMaybeUndefined<TLayout>;
};
