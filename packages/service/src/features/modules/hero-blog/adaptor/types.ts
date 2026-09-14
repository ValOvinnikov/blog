import type {
  ISanityImage,
  TContentAlignment,
  TFullBrandVariant,
  THeroVariant,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaAction } from '@blog/service/shared/transformers/to-cta-action';
import type { THeroPrimaryAction } from '@blog/service/shared/transformers/to-hero-primary-action';

type THeroBlogModuleBase = {
  brandVariant: TFullBrandVariant;
  variant: THeroVariant;
  eyebrow: TMaybeUndefined<string>;
  supportingText: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  primaryAction: TMaybeUndefined<THeroPrimaryAction>;
  secondaryAction: TMaybeUndefined<TCtaAction>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<TLayout>;
};

export type THeroBlogModule =
  | (THeroBlogModuleBase & { hasPost: true; heading: string })
  | (THeroBlogModuleBase & { hasPost: false });
