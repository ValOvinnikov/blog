import type {
  ILink,
  ISanityImage,
  TBrandVariant,
  TContentAlignment,
  TDisplayMode,
  THeadingBlock,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { TModuleAppearance } from '@blog/service/shared/transformers/module/to-module-appearance';

export type TTestimonialItem = {
  id: string;
  name: string;
  quote: TPortableTextBlock[];
  role: TMaybeUndefined<string>;
  image: TMaybeUndefined<ISanityImage>;
  link: TMaybeUndefined<ILink>;
};

export type TTestimonialModule = TModuleAppearance & {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  testimonials: TTestimonialItem[];
  ctaButtons: TCtaButton[];
  displayMode: TDisplayMode;
  cardAlignment: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TWideLayout>;
};
