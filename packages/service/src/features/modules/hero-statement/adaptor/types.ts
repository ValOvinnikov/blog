import type {
  ISanityImage,
  TBrandVariant,
  TContentAlignment,
  THeadingBlock,
  THeroVariant,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { THeroLayout } from '@blog/service/shared/transformers/layout/to-layout';

export type THeroStatementModule = {
  brandVariant: TBrandVariant;
  variant: THeroVariant;
  headingBlock: THeadingBlock;
  eyebrow: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  ctaButtons: TCtaButton[];
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<THeroLayout>;
};
