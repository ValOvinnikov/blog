import type {
  ISanityImage,
  InlineText,
  TContentAlignment,
  TCtaVariant,
  TFullBrandVariant,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/to-cta-button';

export type { TCtaButton };

export type TCtaModule = {
  variant: TCtaVariant;
  brandVariant: TFullBrandVariant;
  bandTone: TFullBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  headingBlock: THeadingBlock;
  content: TMaybeUndefined<InlineText>;
  image: TMaybeUndefined<ISanityImage>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mobileMediaOrder: TMaybeUndefined<TMediaOrder>;
  ctaButtons: TCtaButton[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
