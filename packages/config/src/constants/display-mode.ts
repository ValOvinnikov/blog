import type { TValueOf } from '@shinefold/config/utils';

export const DISPLAY_MODE = {
  GRID: 'GRID',
  CAROUSEL: 'CAROUSEL',
} as const;

export type TDisplayMode = TValueOf<typeof DISPLAY_MODE>;
