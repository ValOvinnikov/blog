import type {
  ISanityImage,
  TBrandVariant,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';
import type { THeroPresentation } from '@shinefold/service/shared/transformers/hero/to-hero-presentation';
import type { THeroLayout } from '@shinefold/service/shared/transformers/layout/to-layout';

export type THeroBlogButton = TCtaButton;

export type THeroBlogModuleBase = {
  brandVariant: TBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  supportingText: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  ctaButtons: THeroBlogButton[];
  presentation: THeroPresentation;
  layout: TMaybeUndefined<THeroLayout>;
};

export type THeroBlogModule =
  | (THeroBlogModuleBase & { hasPost: true; heading: string })
  | (THeroBlogModuleBase & { hasPost: false; isPostUntranslated: boolean });
