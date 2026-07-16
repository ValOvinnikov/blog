import type { TMaybeUndefined } from '@blog/config';

export type TBrand = {
  name: string;
  prefix: string;
  suffix: TMaybeUndefined<string>;
  logoUrl: TMaybeUndefined<string>;
};

export type TSiteSettings = {
  brand: TBrand;
  description: string;
  tagline: TMaybeUndefined<string>;
  defaultOgImageUrl: TMaybeUndefined<string>;
};
