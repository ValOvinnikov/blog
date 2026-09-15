import type {
  ISanityImage,
  TContentAlignment,
  TFullBrandVariant,
  THeroVariant,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/to-cta-button';

export type { TCtaButton };

/** A hero-blog CTA button — a `TCtaButton` plus the sr-only suffix the derived primary carries when it falls back to its default label. */
export type THeroBlogButton = TCtaButton & {
  hiddenLabelSuffix: TMaybeUndefined<string>;
};

export type THeroBlogModuleBase = {
  brandVariant: TFullBrandVariant;
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
