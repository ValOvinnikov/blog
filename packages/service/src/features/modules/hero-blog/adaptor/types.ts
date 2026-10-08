import type {
  ISanityImage,
  TBrandVariant,
  TContentAlignment,
  THeroVariant,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { THeroLayout } from '@blog/service/shared/transformers/layout/to-layout';

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
  layout: TMaybeUndefined<THeroLayout>;
};

export type THeroBlogModule =
  | (THeroBlogModuleBase & { hasPost: true; heading: string })
  | (THeroBlogModuleBase & { hasPost: false; isPostUntranslated: boolean });
