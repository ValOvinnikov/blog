import type {
  BasicText,
  ISanityImage,
  TContentAlignment,
  TCtaVariant,
  TFullBrandVariant,
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
  headingBlock: {
    heading: string;
    supportingText: TMaybeUndefined<string>;
  };
  content: TMaybeUndefined<BasicText>;
  image: TMaybeUndefined<ISanityImage>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mobileMediaOrder: TMaybeUndefined<TMediaOrder>;
  actions: TCtaAction[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
