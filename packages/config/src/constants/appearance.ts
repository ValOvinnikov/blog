import type { TValueOf } from '@blog/config/utils';

export const BRAND_VARIANT = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  BRAND_PRIMARY: 'BRAND_PRIMARY',
} as const;

export type TBrandVariant = TValueOf<typeof BRAND_VARIANT>;

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

export const ALIGN = {
  START: 'START',
  CENTER: 'CENTER',
} as const;

export type TAlign = TValueOf<typeof ALIGN>;

export type TAppearance = {
  spacingTop?: TSpacingScale;
  spacingBottom?: TSpacingScale;
  containerWidth?: TContainerWidth;
  align?: TAlign;
  divider?: boolean;
};
