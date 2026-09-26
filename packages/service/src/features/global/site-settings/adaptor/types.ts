import type {
  ISanityImage,
  Settings_site,
  TMaybeUndefined,
} from '@blog/config';

export type TBrand = {
  name: string;
  tagline: TMaybeUndefined<string>;
  logo: TMaybeUndefined<ISanityImage>;
};

export type TSiteSettings = {
  brand: TBrand;
  currency: NonNullable<Settings_site['currency']>;
};
