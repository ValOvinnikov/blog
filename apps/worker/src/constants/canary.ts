import type { TValueOf } from '@shinefold/config/utils';

export const CANARY_LOG = {
  NOT_CONFIGURED: 'canary.not_configured',
  FAILED: 'canary.failed',
} as const;

export const CANARY_FAILURE = {
  START_FAILED: 'START_FAILED',
  RUN_FAILED: 'RUN_FAILED',
  TIMED_OUT: 'TIMED_OUT',
} as const;

export type TCanaryFailure = TValueOf<typeof CANARY_FAILURE>;

export const CANARY_TIMEOUT_MS = 60_000;
