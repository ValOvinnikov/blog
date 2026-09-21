import type {
  ISanityImage,
  ProseText,
  TContentAlignment,
  TFullBrandVariant,
  THeadingBlock,
  THeroVariant,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/to-cta-button';
import type { TPortableTextBlockWithResolvedLinks } from '@blog/service/shared/transformers/to-portable-text-mark-def';
import type { TSocialProfile } from '@blog/service/shared/transformers/to-social-profile';

export type THeroProfileModule = {
  brandVariant: TFullBrandVariant;
  variant: THeroVariant;
  headingBlock: THeadingBlock;
  eyebrow: TMaybeUndefined<string>;
  avatarName: string;
  sanityImage: TMaybeUndefined<ISanityImage>;
  bio: TMaybeUndefined<
    Array<TPortableTextBlockWithResolvedLinks<ProseText[number]>>
  >;
  socialLinks: TSocialProfile[];
  ctaButtons: TCtaButton[];
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<TLayout>;
};
