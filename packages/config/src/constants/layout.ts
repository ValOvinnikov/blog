import type { TValueOf } from '@shinefold/config/utils';

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

export type TContentAlignmentOf<TKeys extends keyof typeof CONTENT_ALIGNMENT> =
  (typeof CONTENT_ALIGNMENT)[TKeys];

export type THeadingAlignment = TContentAlignmentOf<'LEFT' | 'CENTER'>;

export type THeadingBlock = {
  heading: string;
  supportingText?: string;
};

export const MEDIA_ORDER = {
  LAST: 'LAST',
  FIRST: 'FIRST',
} as const;

export type TMediaOrder = TValueOf<typeof MEDIA_ORDER>;
