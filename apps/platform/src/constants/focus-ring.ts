import type { TValueOf } from '@shinefold/config/utils';

export const FOCUS_RING_GROUND = {
  SIDE: 'SIDE',
  BG: 'BG',
  SURFACE: 'SURFACE',
  SURFACE_2: 'SURFACE_2',
  SURFACE_HEAD: 'SURFACE_HEAD',
  POPOVER: 'POPOVER',
  POPOVER_HOVER: 'POPOVER_HOVER',
  ON_SELECTED: 'ON_SELECTED',
  HOVER_TINT: 'HOVER_TINT',
  THEME_TRACK: 'THEME_TRACK',
  SELECTED_TINT: 'SELECTED_TINT',
} as const;

export type TFocusRingGround = TValueOf<typeof FOCUS_RING_GROUND>;

export type TCheckedFocusRingGround = typeof FOCUS_RING_GROUND.ON_SELECTED;

export const FOCUS_RING_TRIGGER = {
  FOCUS_VISIBLE: 'FOCUS_VISIBLE',
  LIST_HIGHLIGHTED: 'LIST_HIGHLIGHTED',
  INNER_FOCUS_VISIBLE: 'INNER_FOCUS_VISIBLE',
} as const;

export type TFocusRingTrigger = TValueOf<typeof FOCUS_RING_TRIGGER>;
