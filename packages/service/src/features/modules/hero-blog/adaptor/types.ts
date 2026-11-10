import type {
  ISanityImage,
  TBrandVariant,
  TMaybeUndefined,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { THeroPresentation } from '@blog/service/shared/transformers/hero/to-hero-presentation';
import type { THeroLayout } from '@blog/service/shared/transformers/layout/to-layout';

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
