import type { TValueOf } from '@blog/config/utils';

export const BRAND_VARIANT = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  BRAND_PRIMARY: 'BRAND_PRIMARY',
} as const;

export type TBrandVariant = TValueOf<typeof BRAND_VARIANT>;

export type TBrandVariantOf<TKeys extends keyof typeof BRAND_VARIANT> =
  (typeof BRAND_VARIANT)[TKeys];

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

export const HEADING_ALIGN = {
  LEFT: 'LEFT',
  CENTER: 'CENTER',
  RIGHT: 'RIGHT',
} as const;

export type THeadingAlign = TValueOf<typeof HEADING_ALIGN>;

export type TSectionHeader = {
  heading?: string;
  supportingText?: string;
  align?: THeadingAlign;
};
