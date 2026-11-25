import type {
  ISanityImage,
  TBrandVariant,
  THeadingBlock,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';
import type { THeroPresentation } from '@shinefold/service/shared/transformers/hero/to-hero-presentation';
import type { THeroLayout } from '@shinefold/service/shared/transformers/layout/to-layout';

export type THeroStatementModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  eyebrow: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  ctaButtons: TCtaButton[];
  footnote: TMaybeUndefined<string>;
  presentation: THeroPresentation;
  layout: TMaybeUndefined<THeroLayout>;
};
