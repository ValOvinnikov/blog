export type TBrand = {
  name: string;
  prefix: string;
  suffix: string | undefined;
  logoUrl: string | undefined;
};

export type TSiteSettings = {
  brand: TBrand;
  description: string;
  tagline: string | undefined;
  defaultOgImageUrl: string | undefined;
};
