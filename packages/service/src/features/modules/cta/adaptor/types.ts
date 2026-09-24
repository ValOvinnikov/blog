import type {
  ISanityImage,
  TBrandVariant,
  TContentAlignment,
  TCtaVariant,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
  TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type TCtaModule = {
  variant: TCtaVariant;
  brandVariant: TBrandVariant;
  bandTone: TBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  headingBlock: THeadingBlock;
  content: TMaybeUndefined<TPortableTextBlock[]>;
  image: TMaybeUndefined<ISanityImage>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mobileMediaOrder: TMaybeUndefined<TMediaOrder>;
  ctaButtons: TCtaButton[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
