import type {
  ISanityImage,
  TBrandVariant,
  THeadingBlock,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@shinefold/config';
import type { TCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';
import type { THeroPresentation } from '@shinefold/service/shared/transformers/hero/to-hero-presentation';
import type { THeroLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import type { TSocialProfile } from '@shinefold/service/shared/transformers/social-profile/to-social-profile';

export type THeroProfileModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  eyebrow: TMaybeUndefined<string>;
  avatarName: string;
  sanityImage: TMaybeUndefined<ISanityImage>;
  bio: TMaybeUndefined<TPortableTextBlock[]>;
  socialLinks: TSocialProfile[];
  ctaButtons: TCtaButton[];
  presentation: THeroPresentation;
  layout: TMaybeUndefined<THeroLayout>;
};
