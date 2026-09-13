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
import type { TCtaAction } from '@blog/service/shared/transformers/to-cta-action';

export type { TCtaAction };

export type TCtaModule = {
  variant: TCtaVariant;
  brandVariant: TFullBrandVariant;
  bandTone: TFullBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  headingBlock: THeadingBlock;
  content: TMaybeUndefined<InlineText>;
  image: TMaybeUndefined<ISanityImage>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mobileMediaOrder: TMaybeUndefined<TMediaOrder>;
  actions: TCtaAction[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
