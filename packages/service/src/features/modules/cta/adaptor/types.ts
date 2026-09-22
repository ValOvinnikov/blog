import type {
  ISanityImage,
  TContentAlignment,
  TCtaVariant,
  TFullBrandVariant,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
  TPortableText,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/to-cta-button';

export type TResolvedCtaContentBlock = TPortableText;

export type TCtaModule = {
  variant: TCtaVariant;
  brandVariant: TFullBrandVariant;
  bandTone: TFullBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  headingBlock: THeadingBlock;
  content: TMaybeUndefined<TPortableText[]>;
  image: TMaybeUndefined<ISanityImage>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mobileMediaOrder: TMaybeUndefined<TMediaOrder>;
  ctaButtons: TCtaButton[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
