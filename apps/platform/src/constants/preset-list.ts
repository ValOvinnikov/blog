import type { TValueOf } from '@shinefold/config/utils';

export const PRESET_LIST_LAYOUT = {
  GRID: 'GRID',
  ROWS: 'ROWS',
} as const;

export type TPresetListLayout = TValueOf<typeof PRESET_LIST_LAYOUT>;
