import type { TBrandVariants, TMaybeUndefined } from '@blog/config';

export type TBrand = {
  name: string;
  prefix: string;
  suffix: TMaybeUndefined<string>;
  specLine: TMaybeUndefined<string>;
  logoUrl: TMaybeUndefined<string>;
  variant: TBrandVariants;
};

export type TSiteSettings = {
  brand: TBrand;
  description: string;
  tagline: TMaybeUndefined<string>;
  defaultOgImageUrl: TMaybeUndefined<string>;
};
