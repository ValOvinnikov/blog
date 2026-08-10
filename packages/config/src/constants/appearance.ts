import type { TValueOf } from '@blog/config/utils';

export const BACKGROUND_TONE = {
  DEFAULT: 'DEFAULT',
  SUBTLE: 'SUBTLE',
  SURFACE: 'SURFACE',
  ACCENT_TINT: 'ACCENT_TINT',
  INVERSE: 'INVERSE',
} as const;

export type TBackgroundTone = TValueOf<typeof BACKGROUND_TONE>;

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
  background: TBackgroundTone;
  spacingTop: TSpacingScale;
  spacingBottom: TSpacingScale;
  containerWidth: TContainerWidth;
  align: TAlign;
  divider: boolean;
};
