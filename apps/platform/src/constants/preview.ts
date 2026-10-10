import type { TValueOf } from '@blog/config/utils';

export const PREVIEW_MODE = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
} as const;

export type TPreviewMode = TValueOf<typeof PREVIEW_MODE>;

export const PREVIEW_WIDTH = {
  DESKTOP: 'DESKTOP',
  MOBILE: 'MOBILE',
} as const;

export type TPreviewWidth = TValueOf<typeof PREVIEW_WIDTH>;
