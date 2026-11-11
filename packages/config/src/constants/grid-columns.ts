import type { TValueOf } from '@blog/config/utils';

export const GRID_COLUMNS = {
  TWO: 'TWO',
  THREE: 'THREE',
  FOUR: 'FOUR',
} as const;

export type TGridColumns = TValueOf<typeof GRID_COLUMNS>;
