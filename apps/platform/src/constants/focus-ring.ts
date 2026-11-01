import type { TValueOf } from '@blog/config/utils';

export const FOCUS_RING_GROUND = {
  SIDE: 'SIDE',
  BG: 'BG',
  SURFACE: 'SURFACE',
  SURFACE_HEAD: 'SURFACE_HEAD',
  POPOVER: 'POPOVER',
  THEME_TRACK: 'THEME_TRACK',
  TOAST: 'TOAST',
} as const;

export type TFocusRingGround = TValueOf<typeof FOCUS_RING_GROUND>;

export type TInsetFocusRingGround = typeof FOCUS_RING_GROUND.SURFACE;
