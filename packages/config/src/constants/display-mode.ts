import type { TValueOf } from '@blog/config/utils';

export const DISPLAY_MODE = {
  GRID: 'GRID',
  CAROUSEL: 'CAROUSEL',
} as const;

export type TDisplayMode = TValueOf<typeof DISPLAY_MODE>;
