import type { ISanityImage, TMaybeUndefined } from '@blog/config';

export type TBrand = {
  name: string;
  specLine: TMaybeUndefined<string>;
  logo: TMaybeUndefined<ISanityImage>;
};

export type TSiteSettings = {
  brand: TBrand;
  description: string;
  tagline: TMaybeUndefined<string>;
};
