import type {
  ISanityImage,
  TBrandVariant,
  THeadingBlock,
  TMaybeUndefined,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { THeroPresentation } from '@blog/service/shared/transformers/hero/to-hero-presentation';
import type { THeroLayout } from '@blog/service/shared/transformers/layout/to-layout';

export type THeroStatementModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  eyebrow: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  ctaButtons: TCtaButton[];
  presentation: THeroPresentation;
  layout: TMaybeUndefined<THeroLayout>;
};
