import type { TValueOf } from '@blog/config/utils';

export const BRAND_VARIANT = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  BRAND_PRIMARY: 'BRAND_PRIMARY',
} as const;

export type TBrandVariant = TValueOf<typeof BRAND_VARIANT>;

export type TBrandVariantOf<TKeys extends keyof typeof BRAND_VARIANT> =
  (typeof BRAND_VARIANT)[TKeys];

export const FULL_BRAND_VARIANT_LIST = [
  BRAND_VARIANT.BRAND_PRIMARY,
  BRAND_VARIANT.PRIMARY,
  BRAND_VARIANT.SECONDARY,
] as const satisfies readonly TBrandVariant[];

export type TFullBrandVariant = (typeof FULL_BRAND_VARIANT_LIST)[number];

export const SPACING_SCALE = {
  NONE: 'NONE',
  SM: 'SM',
  MD: 'MD',
  LG: 'LG',
  XL: 'XL',
} as const;

export type TSpacingScale = TValueOf<typeof SPACING_SCALE>;

export const CONTAINER_WIDTH = {
  NARROW: 'NARROW',
  WIDE: 'WIDE',
  FULL: 'FULL',
} as const;

export type TContainerWidth = TValueOf<typeof CONTAINER_WIDTH>;

export type TLayout = {
  spacingTop?: TSpacingScale;
  spacingBottom?: TSpacingScale;
  containerWidth?: TContainerWidth;
  dividerTop?: boolean;
  dividerBottom?: boolean;
};

export const CONTENT_ALIGNMENT = {
  LEFT: 'LEFT',
  CENTER: 'CENTER',
  RIGHT: 'RIGHT',
} as const;

export type TContentAlignment = TValueOf<typeof CONTENT_ALIGNMENT>;

export type TSectionHeader = {
  heading?: string;
  supportingText?: string;
};
