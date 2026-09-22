import type {
  ISanityImage,
  TBrandVariant,
  TContentAlignment,
  THeadingBlock,
  THeroVariant,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
  TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/to-cta-button';
import type { TSocialProfile } from '@blog/service/shared/transformers/to-social-profile';

export type THeroProfileModule = {
  brandVariant: TBrandVariant;
  variant: THeroVariant;
  headingBlock: THeadingBlock;
  eyebrow: TMaybeUndefined<string>;
  avatarName: string;
  sanityImage: TMaybeUndefined<ISanityImage>;
  bio: TMaybeUndefined<TPortableTextBlock[]>;
  socialLinks: TSocialProfile[];
  ctaButtons: TCtaButton[];
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<TLayout>;
};
