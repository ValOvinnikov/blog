import type { ISanityImage, TMaybeUndefined } from '@blog/config';

export type TBrand = {
  name: string;
  tagline: TMaybeUndefined<string>;
  logo: TMaybeUndefined<ISanityImage>;
};

export type TSiteSettings = {
  brand: TBrand;
};
