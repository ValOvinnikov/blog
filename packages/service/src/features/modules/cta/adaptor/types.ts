import type {
  ISanityImage,
  TBrandVariant,
  TContentAlignment,
  TCtaVariant,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
  TPortableTextBlock,
} from '@shinefold/config';
import type { TCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';
import type { TModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';

export type TCtaModule = TModuleAppearance & {
  variant: TCtaVariant;
  brandVariant: TBrandVariant;
  bandTone: TBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  headingBlock: THeadingBlock;
  content: TMaybeUndefined<TPortableTextBlock[]>;
  image: TMaybeUndefined<ISanityImage>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mobileMediaOrder: TMaybeUndefined<TMediaOrder>;
  ctaButtons: TCtaButton[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
