import type { TValueOf } from '@blog/config/utils';

export const SEGMENTED_LAYOUT = {
  FIT: 'FIT',
  WIDE: 'WIDE',
  SINGLE_ROW: 'SINGLE_ROW',
} as const;

export type TSegmentedLayout = TValueOf<typeof SEGMENTED_LAYOUT>;
