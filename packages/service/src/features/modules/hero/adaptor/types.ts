import type {
  ILink,
  ISanityImage,
  TBrandVariant,
  TMaybeUndefined,
} from '@blog/config';
import type { THeroPrimaryAction } from '@blog/service/shared/transformers/hero/to-hero-primary-action';
import type { THeroLayout } from '@blog/service/shared/transformers/layout/to-layout';

export type THeroModule = {
  brandVariant: TBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  title: TMaybeUndefined<string>;
  subtitle: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  primaryAction: TMaybeUndefined<THeroPrimaryAction>;
  secondaryAction: TMaybeUndefined<ILink>;
  layout: TMaybeUndefined<THeroLayout>;
};
