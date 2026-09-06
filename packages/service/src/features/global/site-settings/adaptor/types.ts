import type { TMaybeUndefined } from '@blog/config';
import type { TRawImage } from '@blog/service/shared/transformers/build-image-url';

export type TBrand = {
  name: string;
  specLine: TMaybeUndefined<string>;
  logoUrl: TMaybeUndefined<string>;
  /** Raw Sanity image reference, for callers that need their own `buildImageUrl` transform (e.g. a favicon crop) instead of the pre-built `logoUrl`. */
  logoAsset: TMaybeUndefined<TRawImage>;
};

export type TSiteSettings = {
  brand: TBrand;
  description: string;
  tagline: TMaybeUndefined<string>;
  defaultOgImageUrl: TMaybeUndefined<string>;
};
