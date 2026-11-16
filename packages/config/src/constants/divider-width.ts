import type { TValueOf } from '@shinefold/config/utils';

export const DIVIDER_WIDTH = {
  HAIRLINE: 'HAIRLINE',
  BOLD: 'BOLD',
} as const;

export type TDividerWidth = TValueOf<typeof DIVIDER_WIDTH>;
