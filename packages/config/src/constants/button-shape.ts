import type { TValueOf } from '@shinefold/config/utils';

export const BUTTON_SHAPE = {
  SQUARE: 'SQUARE',
  ROUNDED: 'ROUNDED',
  PILL: 'PILL',
} as const;

export type TButtonShape = TValueOf<typeof BUTTON_SHAPE>;
