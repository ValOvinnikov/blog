import type { TValueOf } from '@blog/config/utils';

export const ACTION_OUTCOME = {
  SUCCESS: 'SUCCESS',
  INVALID: 'INVALID',
  BLOCKED: 'BLOCKED',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAVAILABLE: 'UNAVAILABLE',
  REFUSED: 'REFUSED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type TActionOutcome = TValueOf<typeof ACTION_OUTCOME>;

export type TActionRefusal = Exclude<
  TActionOutcome,
  typeof ACTION_OUTCOME.SUCCESS | typeof ACTION_OUTCOME.INVALID
>;
