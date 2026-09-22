import type {
  ISanityImage,
  TContentAlignment,
  TFullBrandVariant,
  THeadingBlock,
  THeroVariant,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type THeroStatementModule = {
  brandVariant: TFullBrandVariant;
  variant: THeroVariant;
  headingBlock: THeadingBlock;
  eyebrow: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  ctaButtons: TCtaButton[];
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<TLayout>;
};
