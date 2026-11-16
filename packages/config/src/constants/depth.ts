import type { TValueOf } from '@shinefold/config/utils';

export const DEPTH = {
  SKIM: 'SKIM',
  READ: 'READ',
  DEEP: 'DEEP',
} as const;

export type TDepth = TValueOf<typeof DEPTH>;
