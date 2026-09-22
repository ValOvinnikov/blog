import type {
  ILink,
  ISanityImage,
  TFullBrandVariant,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';
import type { THeroPrimaryAction } from '@blog/service/shared/transformers/hero/to-hero-primary-action/to-hero-primary-action';

export type THeroModule = {
  brandVariant: TFullBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  title: TMaybeUndefined<string>;
  subtitle: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  primaryAction: TMaybeUndefined<THeroPrimaryAction>;
  secondaryAction: TMaybeUndefined<ILink>;
  layout: TMaybeUndefined<TLayout>;
};
