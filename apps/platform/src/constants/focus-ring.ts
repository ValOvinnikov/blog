import type { TValueOf } from '@blog/config/utils';

export const FOCUS_RING_GROUND = {
  SIDE: 'SIDE',
  BG: 'BG',
  SURFACE: 'SURFACE',
  SURFACE_2: 'SURFACE_2',
  SURFACE_HEAD: 'SURFACE_HEAD',
  POPOVER: 'POPOVER',
  POPOVER_HOVER: 'POPOVER_HOVER',
  SEGMENT_ON: 'SEGMENT_ON',
  HOVER_TINT: 'HOVER_TINT',
  THEME_TRACK: 'THEME_TRACK',
  BRAND_WEAK: 'BRAND_WEAK',
} as const;

export type TFocusRingGround = TValueOf<typeof FOCUS_RING_GROUND>;

export type TCheckedFocusRingGround = typeof FOCUS_RING_GROUND.SEGMENT_ON;

export const FOCUS_RING_TRIGGER = {
  FOCUS_VISIBLE: 'FOCUS_VISIBLE',
  LIST_HIGHLIGHTED: 'LIST_HIGHLIGHTED',
  INNER_FOCUS_VISIBLE: 'INNER_FOCUS_VISIBLE',
} as const;

export type TFocusRingTrigger = TValueOf<typeof FOCUS_RING_TRIGGER>;
