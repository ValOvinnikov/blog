import type { TValueOf } from '@shinefold/config/utils';

export const HEADING_WEIGHT = {
  REGULAR: 'REGULAR',
  MEDIUM: 'MEDIUM',
  SEMIBOLD: 'SEMIBOLD',
  BOLD: 'BOLD',
} as const;

export type THeadingWeight = TValueOf<typeof HEADING_WEIGHT>;

export const HEADING_CASE = {
  AS_WRITTEN: 'AS_WRITTEN',
  UPPERCASE: 'UPPERCASE',
} as const;

export type THeadingCase = TValueOf<typeof HEADING_CASE>;
