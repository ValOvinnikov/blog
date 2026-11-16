import type { TValueOf } from '@shinefold/config/utils';

export const STEP_INDICATOR_STATE = {
  DONE: 'DONE',
  FAILED: 'FAILED',
  RUNNING: 'RUNNING',
  ACTIVE: 'ACTIVE',
  UPCOMING: 'UPCOMING',
} as const;

export type TStepIndicatorState = TValueOf<typeof STEP_INDICATOR_STATE>;
