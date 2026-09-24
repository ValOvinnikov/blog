import type {
  ISanityImage,
  TBrandVariant,
  TContentAlignment,
  THeroVariant,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type THeroBlogButton = TCtaButton;

export type THeroBlogModuleBase = {
  brandVariant: TBrandVariant;
  variant: THeroVariant;
  eyebrow: TMaybeUndefined<string>;
  supportingText: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  ctaButtons: THeroBlogButton[];
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<TLayout>;
};

export type THeroBlogModule =
  | (THeroBlogModuleBase & { hasPost: true; heading: string })
  | (THeroBlogModuleBase & { hasPost: false });
