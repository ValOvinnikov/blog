import type { TValueOf } from '@blog/config/utils';

export const SEGMENTED_OPTION_WIDTH = {
  FIT: 'FIT',
  WIDE: 'WIDE',
} as const;

export type TSegmentedOptionWidth = TValueOf<typeof SEGMENTED_OPTION_WIDTH>;
