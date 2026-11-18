import { HTTP_STATUS } from '@shinefold/config/constants';

export const SCHEDULED_POST_STATE = {
  DUE: 'DUE',
  SCHEDULED: 'SCHEDULED',
  STALE: 'STALE',
  REDATED: 'REDATED',
} as const;

// Covers web's enqueue hop for a post dated only seconds ahead.
export const SCHEDULED_POST_GRACE_MS = 60_000;
export const SCHEDULED_POST_WEB_RETRYABLE_STATUSES: readonly number[] = [
  HTTP_STATUS.REQUEST_TIMEOUT,
  HTTP_STATUS.TOO_EARLY,
  HTTP_STATUS.TOO_MANY_REQUESTS,
];
