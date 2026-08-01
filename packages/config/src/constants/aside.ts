import type { TValueOf } from '@blog/config/utils';

export const ASIDE_KIND = {
  WHY_NOT: 'WHY_NOT',
  DIGRESSION: 'DIGRESSION',
  CONTEXT: 'CONTEXT',
} as const;

export type TAsideKind = TValueOf<typeof ASIDE_KIND>;
