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
import type { TPortableTextBlockWithResolvedLinks } from '@blog/service/shared/transformers/to-portable-text-mark-def';

export type { TCtaButton };

export type TResolvedCtaContentBlock = TPortableTextBlockWithResolvedLinks<
  InlineText[number]
>;

export type TCtaModule = {
  variant: TCtaVariant;
  brandVariant: TFullBrandVariant;
  bandTone: TFullBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  headingBlock: THeadingBlock;
  content: TMaybeUndefined<TResolvedCtaContentBlock[]>;
  image: TMaybeUndefined<ISanityImage>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mobileMediaOrder: TMaybeUndefined<TMediaOrder>;
  ctaButtons: TCtaButton[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
