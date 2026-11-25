import type { TValueOf } from '@shinefold/config/utils';

export const ASIDE_KIND = {
  WHY_NOT: 'WHY_NOT',
  DIGRESSION: 'DIGRESSION',
  CONTEXT: 'CONTEXT',
  TIP: 'TIP',
  NOTE: 'NOTE',
  WARNING: 'WARNING',
} as const;

export type TAsideKind = TValueOf<typeof ASIDE_KIND>;
