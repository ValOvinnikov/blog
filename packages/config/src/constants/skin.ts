import type { TValueOf } from '@shinefold/config/utils';

export const SKIN_MODE = {
  MATCH: 'MATCH',
  INVERSE: 'INVERSE',
} as const;

export type TSkinMode = TValueOf<typeof SKIN_MODE>;
