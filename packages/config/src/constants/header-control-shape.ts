import type { TValueOf } from '@blog/config/utils';

export const HEADER_CONTROL_SHAPE = {
  ROUND: 'ROUND',
  ROUNDED: 'ROUNDED',
  SQUARE: 'SQUARE',
} as const;

export type THeaderControlShape = TValueOf<typeof HEADER_CONTROL_SHAPE>;
